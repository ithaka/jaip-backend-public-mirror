import { build_test_server } from "../../test/helpers";
import route_settings from "./routes";

const app = build_test_server([route_settings]);

test('requests the "/search" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/search",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/search/:status" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/search/denied",
  });
  expect(res.statusCode).toEqual(400);
});
