import { build_test_server } from "../../../../test/helpers";

const app = build_test_server();

test('requests the "/grouped/get" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/site-administration/features/grouped/get",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/grouped/reactivate" route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/site-administration/features/grouped/reactivate",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/grouped" add route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/site-administration/features/grouped",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/grouped" edit route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/site-administration/features/grouped",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/grouped" delete route', async () => {
  const res = await app.inject({
    method: "DELETE",
    url: "/site-administration/features/grouped",
  });
  expect(res.statusCode).toEqual(500);
});
