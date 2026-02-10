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

const get_last_updated_route = `${route_settings.options.prefix}${get_route(route_schemas.get_last_updated)}`;
test(`requests the ${get_last_updated_route} route with no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "GET",
    url: get_last_updated_route,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${get_last_updated_route} route with permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_manage_restricted_list,
  );
  const expected_date = new Date("2023-10-01T00:00:00Z");
  db_mock.get_last_updated_restricted_item.mockResolvedValueOnce([
    expected_date,
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: `${get_last_updated_route}`,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(db_mock.get_last_updated_restricted_item).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    last_updated: expected_date.toISOString(),
  });
  expect(res.statusCode).toEqual(200);
});
