import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../tests/helpers.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import { get_route } from "../../../../utils/index.js";
import axios from "axios";
import { basic_admin } from "../../../../tests/fixtures/users/fixtures.js";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../tests/fixtures/auth/fixtures.js";
import {
  create_group_admin_body_invalid,
  create_group_admin_body_valid,
  basic_user_ungrouped_create_group_admins,
} from "../../../../tests/fixtures/site_administration/groups/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.create_group_admin)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "POST",
    url: route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: create_group_admin_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no group permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: create_group_admin_body_valid,
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and add group permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_create_group_admins,
  );
  db_mock.create_group_admin.mockResolvedValueOnce(null);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: create_group_admin_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.create_group_admin).toHaveBeenCalledTimes(1);
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(200);
});
