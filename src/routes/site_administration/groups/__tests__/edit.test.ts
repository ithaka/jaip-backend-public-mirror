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
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../tests/fixtures/auth/fixtures.js";
import {
  basic_user_ungrouped_add_groups,
  basic_user_ungrouped_edit_groups,
  edit_group_body_invalid,
  edit_group_body_valid,
  group_response,
} from "../../../../tests/fixtures/site_administration/groups/fixtures.js";
import { groups, Prisma } from "@prisma/client";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.edit_group)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "PATCH",
    url: route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: edit_group_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no group permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped_add_groups);

  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: edit_group_body_valid,
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and edit group permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_edit_groups,
  );
  db_mock.update_group.mockResolvedValueOnce([
    {
      ...group_response[0],
      created_at: new Date(),
      updated_at: new Date(),
    },
    null,
  ]);

  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: edit_group_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.update_group).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual(group_response[0]);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route with valid body, edit group permissions, but a duplicate name`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_edit_groups,
  );
  db_mock.update_group.mockResolvedValueOnce([
    {} as groups,
    new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`name`)",
      {
        clientVersion: "prisma-client-js",
        code: "P2002",
      },
    ),
  ]);

  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: edit_group_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.update_group).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    duplicate: true,
  });
  expect(res.statusCode).toEqual(200);
});
