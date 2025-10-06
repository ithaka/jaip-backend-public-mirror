import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers";
import { get_route } from "../../../utils/index";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import axios from "axios";
import {
  axios_session_data_with_code,
  axios_session_data_with_email,
  valid_admin_subdomain,
  valid_student_subdomain,
} from "../../../tests/fixtures/auth/fixtures";
import {
  basic_facility,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.get_alerts)}`;
test(`requests the ${route} route from standard student subdomain with no facility`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_code) as typeof axios.post;
  db_mock.get_first_facility.mockResolvedValueOnce(null);
  db_mock.get_targeted_alerts_and_count.mockResolvedValueOnce([[], 0, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(db_mock.get_targeted_alerts_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({ alerts: [], total: 0 });
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route from standard student subdomain with valid facility`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_code) as typeof axios.post;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  db_mock.get_targeted_alerts_and_count.mockResolvedValueOnce([[], 0, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(db_mock.get_targeted_alerts_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({ alerts: [], total: 0 });
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route from standard student subdomain with valid facility`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.get_targeted_alerts_and_count.mockResolvedValueOnce([[], 0, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_targeted_alerts_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({ alerts: [], total: 0 });
  expect(res.statusCode).toEqual(200);
});
