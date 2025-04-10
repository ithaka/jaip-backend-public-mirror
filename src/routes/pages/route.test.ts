import { build_test_server } from "../../tests/helpers";
import route_settings from "./routes";

const app = build_test_server([route_settings]);

test('requests the "/metadata" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/metadata/1234",
  });
  expect(res.statusCode).toEqual(500);
});
