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
  add_subdomain_body_invalid,
  add_subdomain_body_valid,
  basic_user_ungrouped_add_subdomains,
  subdomain_response,
} from "../../../../tests/fixtures/site_administration/subdomains/fixtures.js";
import { Prisma } from "../../../../database/prisma/client.js";
import { Subdomain } from "../../../../types/routes.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.add_subdomain)}`;
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
    payload: add_subdomain_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no subdomain permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: add_subdomain_body_valid,
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and add subdomain permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_add_subdomains,
  );
  db_mock.create_subdomain.mockResolvedValueOnce([subdomain_response[0], null]);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: add_subdomain_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.create_subdomain).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual(subdomain_response[0]);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route with valid body, add subdomain permissions, but a duplicate name`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_add_subdomains,
  );
  db_mock.create_subdomain.mockResolvedValueOnce([
    {} as Subdomain,
    new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`subdomain`)",
      {
        clientVersion: "prisma-client-js",
        code: "P2002",
      },
    ),
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: add_subdomain_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.create_subdomain).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    duplicate: true,
  });
  expect(res.statusCode).toEqual(200);
});
