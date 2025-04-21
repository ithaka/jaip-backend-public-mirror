import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../tests/helpers";
import route_settings from "../../routes";
import { route_schemas } from "../../schemas";
import { get_route } from "../../../../utils";
import {
  add_entities_body_invalid,
  add_entities_body_valid,
} from "../../../../tests/fixtures/account_management/fixtures";
import axios from "axios";
import { axios_session_data_with_email } from "../../../../tests/fixtures/auth/fixtures";
import {
  basic_admin,
  basic_ithaka_admin,
  basic_reviewer,
} from "../../../../tests/fixtures/users/fixtures";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

// add
const add_facilities_route = `${prefix}${get_route(route_schemas.add_facilities)}`;
test(`requests the ${add_facilities_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${add_facilities_route}`,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${add_facilities_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${add_facilities_route}`,
    payload: add_entities_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${add_facilities_route} route with valid body and no add facility permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: `${add_facilities_route}`,
    payload: add_entities_body_valid,
  });

  expect(db_mock.manage_entity).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${add_facilities_route} route with valid body and edit facility permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: `${add_facilities_route}`,
    payload: add_entities_body_valid,
  });

  expect(db_mock.manage_entity).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${add_facilities_route} route with valid body and manage facility permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_ithaka_admin);

  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: `${add_facilities_route}`,
    payload: add_entities_body_valid,
  });

  expect(db_mock.manage_entity).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});
