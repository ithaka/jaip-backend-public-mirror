import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the "/request" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/media-review/request",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/approve" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/media-review/approve",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/deny" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/media-review/deny",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/incomplete" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/media-review/incomplete",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/bulk" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/media-review/bulk",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/bulk-undo" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/media-review/bulk-undo",
  });
  expect(res.statusCode).toEqual(400);
});
