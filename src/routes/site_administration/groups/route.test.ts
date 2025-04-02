import { build_test_server } from "../../../test/helpers";

const app = build_test_server();

test('requests the "/groups/get" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/groups/get",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/groups/reactivate" route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/groups/reactivate",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/groups" add route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/groups",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/groups" edit route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/groups",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/groups" delete route', async () => {
  const res = await app.inject({
    method: "DELETE",
    url: "/groups",
  });
  expect(res.statusCode).toEqual(500);
});
