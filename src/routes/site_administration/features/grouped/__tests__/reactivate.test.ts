import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../../tests/helpers.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import { get_route } from "../../../../../utils/index.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../../tests/fixtures/auth/fixtures.js";
import {
  basic_user_ungrouped_add_grouped_feature,
  basic_user_ungrouped_edit_grouped_feature,
  reactivate_grouped_feature_body_invalid,
  reactivate_grouped_feature_body_valid,
  grouped_feature_response,
} from "../../../../../tests/fixtures/site_administration/features/grouped/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.reactivate_group_feature)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "PATCH",
    url: route,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: reactivate_grouped_feature_body_invalid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no ungrouped feature permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_edit_grouped_feature,
  );

  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: reactivate_grouped_feature_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and add ungrouped feature permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_add_grouped_feature,
  );
  db_mock.update_grouped_feature.mockResolvedValueOnce([
    {
      ...grouped_feature_response[0],
      created_at: new Date(),
      updated_at: new Date(),
    },
    null,
  ]);

  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: reactivate_grouped_feature_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.update_grouped_feature).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual(grouped_feature_response[0]);
  expect(res.statusCode).toEqual(200);
});
