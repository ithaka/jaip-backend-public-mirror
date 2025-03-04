import { build_test_server } from "../../test/helpers";

const app = build_test_server();

test('requests the "/request" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/request",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/approve" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/approve",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/deny" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/deny",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/incomplete" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/incomplete",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/bulk" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/incomplete",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/bulk-undo" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/incomplete",
  });
  expect(res.statusCode).toEqual(500);
});
