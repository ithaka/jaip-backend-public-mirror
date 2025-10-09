import { expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../tests/helpers.js";
import route_settings from "./routes.js";
import { route_schemas } from "./schemas.js";
import { get_route } from "../../utils/index.js";
import {
  axios_session_data_with_code,
  valid_student_subdomain,
} from "../../tests/fixtures/auth/fixtures.js";
import axios from "axios";
const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

const route = `${prefix}${get_route(route_schemas.get_environment)}`;
test(`requests the ${route} route`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
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
  expect(res.json()).toStrictEqual({
    environment: process.env.ENVIRONMENT,
  });
  expect(res.statusCode).toEqual(200);
});
