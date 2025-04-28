import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../tests/helpers";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { get_route } from "../../../../utils";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../tests/fixtures/auth/fixtures";
import {
  reactivate_group_body_invalid,
  reactivate_group_body_valid,
  basic_user_ungrouped_add_groups,
  basic_user_ungrouped_edit_groups,
  group_response,
} from "../../../../tests/fixtures/site_administration/groups/fixtures";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.reactivate_group)}`;
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
    payload: reactivate_group_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no add group permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_edit_groups,
  );

  const res = await app.inject({
    method: "PATCH",
    url: `${route}`,
    payload: reactivate_group_body_valid,
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and add group permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped_add_groups);
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
    payload: reactivate_group_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.update_group).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual(group_response[0]);
  expect(res.statusCode).toEqual(200);
});
