import { build_test_server } from "../../tests/helpers";
import route_settings from "./routes";

const app = build_test_server([route_settings]);

test('requests the "/alerts" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/alerts",
  });
  expect(res.statusCode).toEqual(204);
});
