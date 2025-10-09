import { expect, test } from "vitest";
import { build_test_server, db_mock } from "../../tests/helpers.js";
import route_settings from "./routes.js";
import { route_schemas } from "./schemas.js";
import { get_route, get_subdomain } from "../../utils/index.js";
import { alerts_fixture } from "../../tests/fixtures/alerts/fixtures.js";
import {
  valid_admin_subdomain,
  valid_student_subdomain,
} from "../../tests/fixtures/auth/fixtures.js";
const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

const route = `${prefix}${get_route(route_schemas.subdomain)}`;
test(`requests the ${route} route from standard student subdomain`, async () => {
  db_mock.get_alerts.mockResolvedValueOnce([null, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: valid_student_subdomain,
    },
  });
  expect(res.json()).toStrictEqual({
    subdomain: get_subdomain(valid_student_subdomain),
  });
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route from standard admin subdomain`, async () => {
  db_mock.get_alerts.mockResolvedValueOnce([alerts_fixture, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.json()).toStrictEqual({
    subdomain: get_subdomain(valid_admin_subdomain),
  });
  expect(res.statusCode).toEqual(200);
});

// The actual subdomains submitted here don't matter, because we're mocking the
// database calls.
test(`requests the ${route} route with invalid subdomain`, async () => {
  db_mock.get_valid_subdomain.mockResolvedValueOnce([null, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: "arbitrary.value",
    },
  });

  expect(res.statusCode).toEqual(401);
});

test(`requests the ${route} route with valid subdomain`, async () => {
  db_mock.get_valid_subdomain.mockResolvedValueOnce([
    { subdomain: "arbitrary.value" },
    null,
  ]);
  const res = await app.inject({
    method: "GET",
    url: route,
    headers: {
      host: "arbitrary.value",
    },
  });

  expect(res.json()).toStrictEqual({
    subdomain: "arbitrary.value",
  });
  expect(res.statusCode).toEqual(200);
});
