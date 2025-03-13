import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the "/metadata" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/metadata/1234",
  });
  expect(res.statusCode).toEqual(500);
});
