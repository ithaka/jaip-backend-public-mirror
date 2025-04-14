import { build_test_server } from "../../tests/helpers";
import route_settings from "./routes";
import { route_schemas } from "./schemas";
import { get_route } from "../../utils";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

test('requests the "/entities/get/users" route', async () => {
  const route = get_route(route_schemas.get_users);
  const res = await app.inject({
    method: "POST",
    url: `${prefix}${route}`,
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/entities/get/facilities" route', async () => {
  const route = get_route(route_schemas.get_facilities);
  const res = await app.inject({
    method: "POST",
    url: `${prefix}${route}`,
  });
  expect(res.statusCode).toEqual(400);
});
