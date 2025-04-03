import { build_test_server } from "../../test/helpers";
import route_settings from "./routes";

const app = build_test_server([route_settings]);

test('requests the "/disciplines" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/disciplines",
  });
  expect(res.statusCode).toEqual(500);
});
