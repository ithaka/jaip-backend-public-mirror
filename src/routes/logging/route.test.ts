import { expect, test, vi } from "vitest";
import {
  build_test_server,
  discover_mock,
  db_mock,
} from "../../tests/helpers.js";
import route_settings from "./routes.js";
import { route_schemas } from "./schemas.js";
import { get_route } from "../../utils/index.js";
import {
  iac_account_response,
  iac_credential_response,
  valid_student_subdomain,
} from "../../tests/fixtures/auth/fixtures.js";
import axios from "axios";
import { basic_facility } from "../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

const route = `${prefix}${get_route(route_schemas.logging)}`;

test(`requests the ${route} route with a facility and no body`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with a facility and request body`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: route,
    payload: {
      eventtype: "pep_fe_button_click",
      event_description: "test event description",
    },
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route with missing eventtype`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: route,
    payload: {
      event_description: "missing eventtype",
    },
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid eventtype`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: route,
    payload: {
      eventtype: "pep_test_event",
      event_description: "invalid eventtype",
    },
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(401);
});
