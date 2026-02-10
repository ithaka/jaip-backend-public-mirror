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
import { basic_admin } from "../../../../../tests/fixtures/users/fixtures.js";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../../tests/fixtures/auth/fixtures.js";
import {
  basic_user_ungrouped_add_ungrouped_feature,
  get_ungrouped_feature_body_invalid,
  get_ungrouped_feature_body_valid,
  ungrouped_feature_response,
} from "../../../../../tests/fixtures/site_administration/features/ungrouped/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.get_ungrouped_features)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "POST",
    url: route,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: get_ungrouped_feature_body_invalid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no ungrouped features permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: get_ungrouped_feature_body_valid,
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
    basic_user_ungrouped_add_ungrouped_feature,
  );
  db_mock.get_ungrouped_features_and_count.mockResolvedValueOnce([
    [
      {
        ...ungrouped_feature_response[0],
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    0,
    null,
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: get_ungrouped_feature_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_ungrouped_features_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    features: ungrouped_feature_response,
    total: 0,
  });
  expect(res.statusCode).toEqual(200);
});
