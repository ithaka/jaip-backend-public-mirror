import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { get_route } from "../../../utils";
import {
  submit_request_invalid,
  submit_request_valid,
} from "../../../tests/fixtures/media_review/requests/fixtures";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_student_subdomain,
} from "../../../tests/fixtures/auth/fixtures";
import {
  basic_facility,
  basic_facility_without_permissions,
} from "../../../tests/fixtures/users/fixtures";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const request_route = `${route_settings.options.prefix}${get_route(route_schemas.request)}`;
test(`requests the ${request_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: request_route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${request_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: request_route,
    payload: submit_request_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${request_route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_facility_without_permissions,
  );

  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: request_route,
    payload: submit_request_valid,
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${request_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: `${request_route}`,
    payload: submit_request_valid,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});
