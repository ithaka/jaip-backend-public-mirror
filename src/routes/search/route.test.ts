import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the "/search" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/search",
  });
  expect(res.statusCode).toEqual(500);
});
