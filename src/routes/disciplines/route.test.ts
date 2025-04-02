import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the "/disciplines" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/disciplines",
  });
  expect(res.statusCode).toEqual(200);
});
