import { build_test_server } from "../../test/helpers";

const app = build_test_server();

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
