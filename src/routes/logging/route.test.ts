import { expect, test, vi } from "vitest";
import {
  build_test_server,
  discover_mock,
  db_mock,
} from "../../tests/helpers.js";
import route_settings from "./routes.js";
import { route_schemas } from "./schemas.js";
import { get_route } from "../../utils/index.js";
import { axios_session_data_with_email } from "../../tests/fixtures/auth/fixtures.js";
import axios from "axios";
import { basic_facility } from "../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

const route = `${prefix}${get_route(route_schemas.logging)}`;

test(`requests the ${route} route with a facility and no body`, async () => {
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: route,
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with a facility and request body`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: route,
    payload: {
      eventtype: "pep_fe_button_click",
      event_description: "test event description",
    },
  });

  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route with missing eventtype`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: route,
    payload: {
      event_description: "missing eventtype",
    },
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid eventtype`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "POST",
    url: route,
    payload: {
      eventtype: "pep_test_event",
      event_description: "invalid eventtype",
    },
  });

  expect(res.statusCode).toEqual(401);
});
