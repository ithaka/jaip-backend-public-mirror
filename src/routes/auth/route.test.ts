import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the nonexistent "/" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/",
  });
  expect(res.statusCode).toEqual(404);
});
