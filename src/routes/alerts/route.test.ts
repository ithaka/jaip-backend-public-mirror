import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the "/alerts" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/alerts",
  });
  expect(res.statusCode).toEqual(204);
});
