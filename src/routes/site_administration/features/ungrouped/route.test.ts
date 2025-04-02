import { build_test_server } from "../../../../test/helpers";

const app = build_test_server();

test('requests the "/ungrouped/get" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/site-administration/features/ungrouped/get",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/ungrouped/reactivate" route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/site-administration/features/ungrouped/reactivate",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/ungrouped" add route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/site-administration/features/ungrouped",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/ungrouped" edit route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/site-administration/features/ungrouped",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/ungrouped" delete route', async () => {
  const res = await app.inject({
    method: "DELETE",
    url: "/site-administration/features/ungrouped",
  });
  expect(res.statusCode).toEqual(400);
});
