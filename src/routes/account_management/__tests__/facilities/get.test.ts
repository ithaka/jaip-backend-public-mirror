import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../tests/helpers";
import route_settings from "../../routes";
import { route_schemas } from "../../schemas";
import { get_route } from "../../../../utils";
import {
  expected_get_users,
  get_entities_body_invalid,
  get_entities_body_valid,
} from "../../../../tests/fixtures/account_management/fixtures";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../tests/fixtures/auth/fixtures";
import {
  basic_admin,
  basic_reviewer,
  basic_user_ungrouped_create_group_admins,
} from "../../../../tests/fixtures/users/fixtures";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

afterEach(() => {
  jest.clearAllMocks();
});

// GET
const get_facilities_route = `${prefix}${get_route(route_schemas.get_facilities)}`;
test(`requests the ${get_facilities_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${get_facilities_route}`,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${get_facilities_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${get_facilities_route}`,
    payload: get_entities_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${get_facilities_route} route with valid body and no account management permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: `${get_facilities_route}`,
    payload: get_entities_body_valid,
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${get_facilities_route} route with valid body and account management permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);
  db_mock.get_facilities_and_count.mockResolvedValueOnce([
    2,
    [basic_admin, basic_reviewer],
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${get_facilities_route}`,
    payload: get_entities_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_facilities_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    total: 2,
    entities: expected_get_users,
  });
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${get_facilities_route} route with valid body and create admins permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_create_group_admins,
  );
  db_mock.get_facilities_and_count.mockResolvedValueOnce([
    2,
    [basic_admin, basic_reviewer],
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${get_facilities_route}`,
    payload: get_entities_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_facilities_and_count).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    total: 2,
    entities: expected_get_users,
  });
  expect(res.statusCode).toEqual(200);
});
