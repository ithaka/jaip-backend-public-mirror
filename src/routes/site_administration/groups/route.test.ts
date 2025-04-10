import { build_test_server } from "../../../tests/helpers";
import route_settings from "./routes";

const app = build_test_server([route_settings]);

test('requests the "/groups/get" route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/site-administration/groups/get",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/groups/reactivate" route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/site-administration/groups/reactivate",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/groups" add route', async () => {
  const res = await app.inject({
    method: "POST",
    url: "/site-administration/groups",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/groups" edit route', async () => {
  const res = await app.inject({
    method: "PATCH",
    url: "/site-administration/groups",
  });
  expect(res.statusCode).toEqual(400);
});

test('requests the "/groups" delete route', async () => {
  const res = await app.inject({
    method: "DELETE",
    url: "/site-administration/groups",
  });
  expect(res.statusCode).toEqual(400);
});
