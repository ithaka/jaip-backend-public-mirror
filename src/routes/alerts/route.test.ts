import { build_test_server } from "../../tests/helpers";
import route_settings from "./routes";
import { route_schemas } from "./schemas";
import { get_route } from "../../utils";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

test('requests the "/alerts" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: `${prefix}${get_route(route_schemas.alerts)}`,
  });
  expect(res.statusCode).toEqual(204);
});
