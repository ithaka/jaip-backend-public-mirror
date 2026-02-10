import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../tests/helpers.js";
import route_settings from "../../routes.js";
import { route_schemas } from "../../schemas.js";
import { get_route } from "../../../../utils/index.js";
import {
  expected_get_users,
  get_entities_body_invalid,
  get_entities_body_valid,
} from "../../../../tests/fixtures/account_management/fixtures.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../tests/fixtures/auth/fixtures.js";
import {
  basic_admin,
  basic_reviewer,
  basic_user_ungrouped_manage_superusers,
} from "../../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

afterEach(() => {
  vi.clearAllMocks();
});

// USERS
// GET
const get_users_route = `${prefix}${get_route(route_schemas.get_users)}`;
test(`requests the ${get_users_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${get_users_route}`,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${get_users_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${get_users_route}`,
    payload: get_entities_body_invalid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${get_users_route} route with valid body and no account management permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: `${get_users_route}`,
    payload: get_entities_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${get_users_route} route with valid body and account management permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);
  db_mock.get_users_and_count.mockResolvedValueOnce([
    2,
    [basic_admin, basic_reviewer],
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${get_users_route}`,
    payload: get_entities_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_users_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    total: 2,
    entities: expected_get_users,
  });
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${get_users_route} route with valid body and superuser permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_manage_superusers,
  );
  db_mock.get_users_and_count.mockResolvedValueOnce([
    2,
    [basic_admin, basic_reviewer],
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${get_users_route}`,
    payload: get_entities_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_users_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    total: 2,
    entities: expected_get_users,
  });
  expect(res.statusCode).toEqual(200);
});
