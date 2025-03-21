import { build_test_server } from "../../../../test/helpers";

const app = build_test_server();

test('requests the "/subdomains/validate" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/subdomains/validate",
  });
  expect(res.statusCode).toEqual(500);
});
