import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../tests/helpers.js";
import { get_route } from "../../utils/index.js";
import { route_schemas } from "./schemas.js";
import route_settings from "./routes.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  iac_account_response,
  iac_credential_response,
  valid_student_subdomain,
} from "../../tests/fixtures/auth/fixtures.js";
import { basic_facility } from "../../tests/fixtures/users/fixtures.js";
import {
  bulk_approval_statuses_disciplines,
  bulk_approval_statuses_journals,
  disciplines_response,
  disciplines_response_with_approval,
  disciplines_response_with_pseudodisciplines,
  journals_response,
  journals_response_with_approval,
} from "../../tests/fixtures/disciplines/fixtures.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const disciplines_route = `${route_settings.options.prefix}${get_route(route_schemas.disciplines)}`;
test(`requests the ${disciplines_route} route without a user or facility`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  const res = await app.inject({
    method: "GET",
    url: disciplines_route,
  });
  expect(res.statusCode).toEqual(500);
});

test(`requests the ${disciplines_route} route with a facility and no statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response)
    .mockResolvedValueOnce({
      status: 200,
      data: disciplines_response,
    }) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  db_mock.get_statuses.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "GET",
    url: disciplines_route,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual(disciplines_response_with_pseudodisciplines);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${disciplines_route} route with a facility and statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response)
    .mockResolvedValueOnce({
      status: 200,
      data: disciplines_response,
    }) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  db_mock.get_statuses.mockResolvedValueOnce([
    bulk_approval_statuses_disciplines,
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: disciplines_route,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(res.json()).toStrictEqual(disciplines_response_with_approval);
  expect(res.statusCode).toEqual(200);
});

// This test uses the first discipline, rather than the parameter defined in the schema
const journals_route = `${route_settings.options.prefix}${get_route(route_schemas.disciplines)}africanamericanstudies-discipline`;
test(`requests the ${journals_route} route without a user or facility`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  const res = await app.inject({
    method: "GET",
    url: journals_route,
  });
  expect(res.statusCode).toEqual(500);
});

test(`requests the ${journals_route} route with a facility and no statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response)
    .mockResolvedValueOnce({
      status: 200,
      data: journals_response,
    }) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  db_mock.get_statuses.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "GET",
    url: journals_route,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual(journals_response);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${journals_route} route with a facility and statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response)
    .mockResolvedValueOnce({
      status: 200,
      data: journals_response,
    }) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);
  db_mock.get_statuses.mockResolvedValueOnce([
    bulk_approval_statuses_journals,
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: journals_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(res.json()).toStrictEqual(journals_response_with_approval);
  expect(res.statusCode).toEqual(200);
});
