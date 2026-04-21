import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../tests/helpers.js";
import route_settings from "./routes.js";
import { route_schemas } from "./schemas.js";
import axios from "axios";

import { get_route } from "../../utils/index.js";
import {
  basic_admin,
  basic_facility,
} from "../../tests/fixtures/users/fixtures.js";
import {
  axios_session_data_with_code,
  axios_session_data_with_email,
  get_ip_bypass_resolved_value,
  iac_account_response,
  iac_credential_response,
  valid_student_subdomain,
} from "../../tests/fixtures/auth/fixtures.js";

import { map_entities } from "../queries/entities.js";

const app = build_test_server([route_settings]);
const route = `${route_settings.options.prefix}${get_route(route_schemas.auth)}`;

afterEach(() => {
  vi.resetAllMocks();
});

test(`returns 401 if no user is present`, async () => {
  // Non-admin subdomain: route_guard calls get_credentials (IAC service path)
  discover_mock.mockResolvedValueOnce(["http://iac-host/", null]);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({ data: {}, status: 200 }) as typeof axios.get;
  // get_current_user falls through to IP bypass with no codes or emails
  db_mock.get_ip_bypass.mockResolvedValueOnce(null);
  const res = await app.inject({
    method: "GET",
    url: route,
  });
  expect(res.statusCode).toEqual(401);
});

test(`returns 200 and user if authenticated`, async () => {
  // Use a student subdomain so get_current_user skips the sitecode-by-subdomain lookup
  const user = map_entities(basic_facility);
  discover_mock.mockResolvedValueOnce(["http://iac-host/", null]);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce(iac_credential_response)
    .mockResolvedValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: { host: valid_student_subdomain },
  });
  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual(user);
});

test(`returns 200 and user if authenticated admin on admin subdomain`, async () => {
  // Admin subdomain: route_guard calls manage_session (session service path)
  const user = map_entities(basic_admin);
  discover_mock.mockResolvedValueOnce(["http://session-host/", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: { host: "admin.test-pep.jstor.org" },
  });
  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual(user);
});

test(`returns 403 if admin subdomain but not authenticated admin`, async () => {
  // Admin subdomain with a facility (non-admin) user: route_guard finds the user
  // but the handler rejects them because they lack the admin role
  discover_mock.mockResolvedValueOnce(["http://session-host/", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_code) as typeof axios.post;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: { host: "admin.test-pep.jstor.org" },
  });
  expect(res.statusCode).toEqual(403);
});

test(`returns 200 via IP bypass when IAC returns no credential for the IP`, async () => {
  // get_credentials: IAC responds 200 but with no accountExternalId, so codes=[].
  // get_current_user then falls through to its own IP bypass loop.
  const user = map_entities(basic_facility);
  discover_mock.mockResolvedValueOnce(["http://iac-host/", null]);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({ data: {}, status: 200 }) as typeof axios.get;
  db_mock.get_ip_bypass.mockResolvedValueOnce(get_ip_bypass_resolved_value);
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: { host: valid_student_subdomain },
  });
  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual(user);
});

test(`returns 200 via IP bypass when IAC returns 404 for the IP`, async () => {
  // get_credentials: IAC returns 404, triggering the bypass lookup inside get_credentials.
  // The bypass's jstor_id becomes a site code, which get_current_user resolves to a facility.
  const user = map_entities(basic_facility);
  const axios_404 = Object.assign(new Error("Not Found"), {
    isAxiosError: true,
    response: { status: 404 },
  });
  discover_mock.mockResolvedValueOnce(["http://iac-host/", null]);
  axios.get = vi.fn().mockRejectedValueOnce(axios_404) as typeof axios.get;
  // First get_first_facility: resolves the bypass inside get_credentials
  db_mock.get_ip_bypass.mockResolvedValueOnce(get_ip_bypass_resolved_value);
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  // Second get_first_facility: get_current_user resolves the site code pushed by the bypass
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: { host: valid_student_subdomain },
  });
  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual(user);
});
