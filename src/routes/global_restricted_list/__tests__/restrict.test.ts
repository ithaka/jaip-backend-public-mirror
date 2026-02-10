// NOTE: This file also includes tests for incomplete statuses. Denial and incomplete
// statuses currently use the same handler and have similar requirements.
import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import { get_route } from "../../../utils/index.js";
import {
  restrict_valid,
  restrict_invalid,
} from "../../../tests/fixtures/global_restricted_list/fixtures.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_user_ungrouped,
  basic_user_ungrouped_manage_restricted_list,
} from "../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const restrict_route = `${route_settings.options.prefix}${get_route(route_schemas.restrict)}`;
test(`requests the ${restrict_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: restrict_route,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${restrict_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: restrict_route,
    payload: restrict_invalid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${restrict_route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: restrict_route,
    payload: restrict_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${restrict_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_manage_restricted_list,
  );

  const res = await app.inject({
    method: "POST",
    url: `${restrict_route}`,
    payload: restrict_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(db_mock.create_restricted_item).toHaveBeenCalledTimes(1);
  expect(db_mock.create_restricted_item).toHaveBeenCalledWith(
    restrict_valid.doi,
    restrict_valid.reason,
    basic_user_ungrouped_manage_restricted_list.entities.id,
  );
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});
