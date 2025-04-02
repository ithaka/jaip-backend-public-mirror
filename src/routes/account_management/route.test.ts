import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the "/entities/get/users" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/entities/users/get",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/entities/get/facilities" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/entities/facilities/get",
  });
  expect(res.statusCode).toEqual(500);
});
