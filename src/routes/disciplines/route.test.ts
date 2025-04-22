import { build_test_server, db_mock, discover_mock } from "../../tests/helpers";
import { get_route } from "../../utils";
import { route_schemas } from "./schemas";
import route_settings from "./routes";
import axios from "axios";
import { axios_session_data_with_email } from "../../tests/fixtures/auth/fixtures";
import { basic_facility } from "../../tests/fixtures/users/fixtures";
import {
  bulk_approval_statuses_disciplines,
  bulk_approval_statuses_journals,
  disciplines_response,
  disciplines_response_with_approval,
  journals_response,
  journals_response_with_approval,
} from "../../tests/fixtures/disciplines/fixtures";

const app = build_test_server([route_settings]);
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const disciplines_route = `${route_settings.options.prefix}${get_route(route_schemas.disciplines)}`;
test(`requests the ${disciplines_route} route without a user or facility`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  const res = await app.inject({
    method: "GET",
    url: disciplines_route,
  });
  expect(res.statusCode).toEqual(500);
});

test(`requests the ${disciplines_route} route with a facility and no statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = jest.fn().mockResolvedValue({
    status: 200,
    data: disciplines_response,
  });
  db_mock.get_statuses.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "GET",
    url: disciplines_route,
  });
  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual(disciplines_response);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${disciplines_route} route with a facility and statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = jest.fn().mockResolvedValue({
    status: 200,
    data: disciplines_response,
  });
  db_mock.get_statuses.mockResolvedValueOnce([
    bulk_approval_statuses_disciplines,
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: disciplines_route,
  });
  console.log(res.json()[0]);
  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(res.json()).toStrictEqual(disciplines_response_with_approval);
  expect(res.statusCode).toEqual(200);
});

// This test uses the first discipline, rather than the parameter defined in the schema
const journals_route = `${route_settings.options.prefix}${get_route(route_schemas.disciplines)}africanamericanstudies-discipline`;
test(`requests the ${journals_route} route without a user or facility`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  const res = await app.inject({
    method: "GET",
    url: journals_route,
  });
  expect(res.statusCode).toEqual(500);
});

test(`requests the ${journals_route} route with a facility and no statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = jest.fn().mockResolvedValue({
    status: 200,
    data: journals_response,
  });
  db_mock.get_statuses.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "GET",
    url: journals_route,
  });
  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual(journals_response);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${journals_route} route with a facility and statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = jest.fn().mockResolvedValue({
    status: 200,
    data: journals_response,
  });
  db_mock.get_statuses.mockResolvedValueOnce([
    bulk_approval_statuses_journals,
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: journals_route,
  });

  console.log(res.json()[0]);
  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(res.json()).toStrictEqual(journals_response_with_approval);
  expect(res.statusCode).toEqual(200);
});
