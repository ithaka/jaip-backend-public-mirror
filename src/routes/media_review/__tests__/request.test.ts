import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import { get_route } from "../../../utils/index.js";
import {
  submit_request_invalid,
  submit_request_valid,
} from "../../../tests/fixtures/media_review/requests/fixtures.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  iac_account_response,
  iac_credential_response,
  valid_student_subdomain,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_facility,
  basic_facility_with_request_permissions,
} from "../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.resetAllMocks();
});

const request_route = `${route_settings.options.prefix}${get_route(route_schemas.request)}`;
test(`requests the ${request_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: request_route,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${request_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: request_route,
    payload: submit_request_invalid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${request_route} route with valid body and no request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);

  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: request_route,
    payload: submit_request_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});

test.each([
  {
    name: "a future end date",
    facility: basic_facility_with_request_permissions,
  },
  {
    name: "a null end date",
    facility: {
      ...basic_facility_with_request_permissions,
      request_permissions: {
        ...basic_facility_with_request_permissions.request_permissions,
        end_date: null,
      },
    },
  },
])(`requests are blocked with $name`, async ({ facility }) => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(facility);

  const res = await app.inject({
    method: "POST",
    url: request_route,
    payload: submit_request_valid,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.payload).toStrictEqual(
    "requests are currently disabled for this facility",
  );
  expect(res.statusCode).toEqual(403);
  expect(db_mock.create_request_statuses).not.toHaveBeenCalled();
});

test.each([
  {
    name: "a past end date",
    facility: {
      ...basic_facility_with_request_permissions,
      request_permissions: {
        ...basic_facility_with_request_permissions.request_permissions,
        end_date: new Date(Date.now() - 1000),
      },
    },
  },
  {
    name: "a future start date",
    facility: {
      ...basic_facility_with_request_permissions,
      request_permissions: {
        ...basic_facility_with_request_permissions.request_permissions,
        start_date: new Date(Date.now() + 1000),
      },
    },
  },
])(`requests are allowed with $name`, async ({ facility }) => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(facility);

  const res = await app.inject({
    method: "POST",
    url: request_route,
    payload: submit_request_valid,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
  expect(db_mock.create_request_statuses).toHaveBeenCalled();
});

test(`requests the ${request_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

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
