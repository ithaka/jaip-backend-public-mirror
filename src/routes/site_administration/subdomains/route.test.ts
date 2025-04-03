import { build_test_server } from "../../../test/helpers";
import route_settings from "./routes";

const app = build_test_server([route_settings]);

test('requests the "/subdomains/get" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/site-administration/subdomains/get",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/subdomains/reactivate" route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/site-administration/subdomains/reactivate",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/subdomains" add route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/site-administration/subdomains",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/subdomains" edit route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/site-administration/subdomains",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/subdomains" delete route', async () => {
  const res = await app.inject({
    method: "DELETE",
    url: "/site-administration/subdomains",
  });
  expect(res.statusCode).toEqual(400);
});
