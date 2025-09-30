import { jest } from "@jest/globals";
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
  basic_admin,
  basic_facility,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures";
import {
  full_targeted_alert_with_facilities,
  full_targeted_alert_with_facilities_and_string_dates,
  valid_get_alerts_query,
} from "../../../tests/fixtures/alerts/fixtures";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.get_paginated_alerts)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "POST",
    url: route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: { invalid: "body" },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and facility`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockReturnValue(axios_session_data_with_code) as typeof axios.post;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: valid_get_alerts_query,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: valid_get_alerts_query,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and admin permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);
  db_mock.get_targeted_alerts_and_count.mockResolvedValueOnce([[], 0, null]);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: valid_get_alerts_query,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_targeted_alerts_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({ alerts: [], total: 0 });
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route with valid body and admin permissions with results`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);
  db_mock.get_targeted_alerts_and_count.mockResolvedValueOnce([
    [full_targeted_alert_with_facilities],
    1,
    null,
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: valid_get_alerts_query,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_targeted_alerts_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    alerts: [full_targeted_alert_with_facilities_and_string_dates],
    total: 1,
  });
  expect(res.statusCode).toEqual(200);
});
