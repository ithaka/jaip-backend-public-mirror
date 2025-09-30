// import { build_test_server } from "../../tests/helpers";
import route_settings from "./routes";
import { route_schemas } from "./schemas";
import { get_route } from "../../utils";
// const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

// TODO: Uncomment, build, and implement actual tests
const route = `${prefix}${get_route(route_schemas.download_offline_index)}`;
test(`requests the ${route} route with invalid request body`, async () => {
  // await app.inject({
  //   method: "GET",
  //   url: route,
  //   headers: {
  //     host: "arbitrary.value",
  //   },
  // });
});

test(`requests the ${route} route with valid request body`, async () => {});
