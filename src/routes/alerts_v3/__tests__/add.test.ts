import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import { get_route } from "../../../utils/index.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import {
  invalid_targeted_alert,
  targeted_alert,
  full_targeted_alert,
  targeted_alert_with_groups,
  targeted_alert_with_facilities,
  full_targeted_alert_with_string_dates,
} from "../../../tests/fixtures/alerts/fixtures.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_admin,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.add_alert)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "POST",
    url: route,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: invalid_targeted_alert,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid alert and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: targeted_alert_with_facilities,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid alert but invalid target and edit facility permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: targeted_alert_with_groups,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid alert but no target and edit facility permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: targeted_alert,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and edit facility permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);
  db_mock.create_targeted_alert.mockResolvedValueOnce([
    full_targeted_alert,
    null,
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: targeted_alert_with_facilities,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.create_targeted_alert).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual(full_targeted_alert_with_string_dates);
  expect(res.statusCode).toEqual(200);
});
