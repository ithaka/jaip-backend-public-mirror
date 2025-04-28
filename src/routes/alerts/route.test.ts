import { build_test_server, db_mock } from "../../tests/helpers";
import route_settings from "./routes";
import { route_schemas } from "./schemas";
import { get_route } from "../../utils";
import { alerts_fixture } from "../../tests/fixtures/alerts/fixtures";
const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

const route = `${prefix}${get_route(route_schemas.alerts)}`;

test(`requests the ${route} route when no alert exists`, async () => {
  db_mock.get_alerts.mockResolvedValueOnce([null, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
  });
  expect(res.statusCode).toEqual(204);
});

test(`requests the ${route} route when an alert exists`, async () => {
  db_mock.get_alerts.mockResolvedValueOnce([alerts_fixture, null]);
  const res = await app.inject({
    method: "GET",
    url: route,
  });
  expect(res.json()).toStrictEqual(alerts_fixture);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route when the database errors`, async () => {
  db_mock.get_alerts.mockResolvedValueOnce([
    alerts_fixture,
    new Error("test error"),
  ]);
  const res = await app.inject({
    method: "GET",
    url: route,
  });

  expect(res.statusCode).toEqual(500);
});
