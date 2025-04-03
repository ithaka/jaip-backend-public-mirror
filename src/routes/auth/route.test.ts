import { build_test_server } from "../../test/helpers";
import route_settings from "./routes";

const app = build_test_server([route_settings]);

test('requests the "/auth" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/auth",
  });
  expect(res.statusCode).toEqual(500);
});
