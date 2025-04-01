import { build_test_server } from "../../../test/helpers";

const app = build_test_server();

test('requests the "/subdomains/get" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/subdomains/get",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/subdomains/reactivate" route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/subdomains/reactivate",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/subdomains" add route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/subdomains",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/subdomains" edit route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/subdomains",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/subdomains" delete route', async () => {
  const res = await app.inject({
    method: "DELETE",
    url: "/subdomains",
  });
  expect(res.statusCode).toEqual(500);
});
