import { expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../tests/helpers.js";
import route_settings from "../../routes.js";
import { route_schemas } from "../../schemas.js";
import { get_route } from "../../../../utils/index.js";
import {
  remove_entities_body_invalid,
  remove_entities_body_valid,
} from "../../../../tests/fixtures/account_management/fixtures.js";
import axios from "axios";
import { axios_session_data_with_email } from "../../../../tests/fixtures/auth/fixtures.js";
import {
  basic_ithaka_admin,
  basic_reviewer,
} from "../../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;

// REMOVE
const remove_facilities_route = `${prefix}${get_route(route_schemas.remove_facilities)}`;
test(`requests the ${remove_facilities_route} route with no body`, async () => {
  const res = await app.inject({
    method: "DELETE",
    url: `${remove_facilities_route}`,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${remove_facilities_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "DELETE",
    url: `${remove_facilities_route}`,
    payload: remove_entities_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${remove_facilities_route} route with valid body and no remove user permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  db_mock.remove_user.mockClear();

  const res = await app.inject({
    method: "DELETE",
    url: `${remove_facilities_route}`,
    payload: remove_entities_body_valid,
  });

  expect(db_mock.remove_user).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${remove_facilities_route} route with valid body and manage facility permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_ithaka_admin);

  db_mock.remove_facility.mockClear();

  const res = await app.inject({
    method: "DELETE",
    url: `${remove_facilities_route}`,
    payload: remove_entities_body_valid,
  });

  expect(db_mock.remove_facility).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});
