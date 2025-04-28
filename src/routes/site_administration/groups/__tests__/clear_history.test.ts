import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../tests/helpers";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { get_route } from "../../../../utils";
import axios from "axios";
import { basic_admin } from "../../../../tests/fixtures/users/fixtures";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../tests/fixtures/auth/fixtures";
import {
  clear_history_body_valid,
  clear_history_body_invalid,
  basic_user_ungrouped_clear_history,
} from "../../../../tests/fixtures/site_administration/groups/fixtures";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.clear_history)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "DELETE",
    url: route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: clear_history_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no clear history permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: clear_history_body_valid,
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and clear history permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_clear_history,
  );
  db_mock.clear_history.mockResolvedValueOnce(null);

  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: clear_history_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.clear_history).toHaveBeenCalledTimes(1);
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(200);
});
