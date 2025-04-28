import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../../tests/helpers";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { get_route } from "../../../../../utils";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../../tests/fixtures/auth/fixtures";
import {
  basic_user_ungrouped_add_ungrouped_feature,
  basic_user_ungrouped_edit_ungrouped_feature,
  reactivate_ungrouped_feature_body_invalid,
  reactivate_ungrouped_feature_body_valid,
  ungrouped_feature_response,
} from "../../../../../tests/fixtures/site_administration/features/ungrouped/fixtures";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.reactivate_ungrouped_feature)}`;
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
    payload: reactivate_ungrouped_feature_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no subdomain permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_edit_ungrouped_feature,
  );

  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: reactivate_ungrouped_feature_body_valid,
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and add ungrouped feature permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_add_ungrouped_feature,
  );
  db_mock.update_ungrouped_feature.mockResolvedValueOnce([
    {
      ...ungrouped_feature_response[0],
      created_at: new Date(),
      updated_at: new Date(),
    },
    null,
  ]);

  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: reactivate_ungrouped_feature_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.update_ungrouped_feature).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual(ungrouped_feature_response[0]);
  expect(res.statusCode).toEqual(200);
});
