// NOTE: This file also includes tests for incomplete statuses. Denial and incomplete
// statuses currently use the same handler and have similar requirements.
import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { get_route } from "../../../utils";
import { restricted_items_list } from "../../../tests/fixtures/global_restricted_list/fixtures";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures";
import {
  basic_user_ungrouped,
  basic_user_ungrouped_manage_restricted_list,
} from "../../../tests/fixtures/users/fixtures";
import { json2csv } from "json-2-csv";
import { map_restricted_items_list } from "../helpers";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const download_route = `${route_settings.options.prefix}${get_route(route_schemas.download_restricted_items)}`;
test(`requests the ${download_route} route with no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "GET",
    url: download_route,
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${download_route} route with permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_manage_restricted_list,
  );
  db_mock.get_restricted_items.mockResolvedValueOnce([
    restricted_items_list,
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: `${download_route}`,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(db_mock.get_restricted_items).toHaveBeenCalledTimes(1);
  const csv = await json2csv(map_restricted_items_list(restricted_items_list));
  expect(res.payload).toStrictEqual(csv);
  expect(res.statusCode).toEqual(200);
});
