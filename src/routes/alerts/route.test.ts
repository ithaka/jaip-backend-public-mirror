import { build_test_server, db_mock, discover_mock } from "../../tests/helpers";
import route_settings from "./routes";
import { route_schemas } from "./schemas";
import { get_route } from "../../utils";
import { alerts_fixture } from "../../tests/fixtures/alerts/fixtures";
import axios from "axios";
import {
  axios_session_data_with_code,
  valid_student_subdomain,
} from "../../tests/fixtures/auth/fixtures";
const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

const route = `${prefix}${get_route(route_schemas.alerts)}`;

test(`requests the ${route} route when no alert exists`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockReturnValue(axios_session_data_with_code) as typeof axios.post;
  db_mock.get_first_facility.mockResolvedValueOnce(null);

  db_mock.get_alerts.mockResolvedValueOnce([null, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(res.statusCode).toEqual(204);
});

test(`requests the ${route} route when an alert exists`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockReturnValue(axios_session_data_with_code) as typeof axios.post;
  db_mock.get_first_facility.mockResolvedValueOnce(null);

  db_mock.get_alerts.mockResolvedValueOnce([alerts_fixture, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(res.json()).toStrictEqual(alerts_fixture);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route when the database errors`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockReturnValue(axios_session_data_with_code) as typeof axios.post;
  db_mock.get_first_facility.mockResolvedValueOnce(null);

  db_mock.get_alerts.mockResolvedValueOnce([
    alerts_fixture,
    new Error("test error"),
  ]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(500);
});
