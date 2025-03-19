import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the "/entities/get/users" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/entities/get/users",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/entities/get/facilities" route', async () => {
  const res = await app.inject({
    method: "GET",
    url: "/entities/get/facilities",
  });
  expect(res.statusCode).toEqual(500);
});
