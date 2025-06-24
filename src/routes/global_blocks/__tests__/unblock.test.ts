// NOTE: This file also includes tests for incomplete statuses. Denial and incomplete
// statuses currently use the same handler and have similar requirements.
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { get_route } from "../../../utils";
import {
  unblock_valid,
  unblock_invalid,
} from "../../../tests/fixtures/global_blocks/fixtures";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures";
import {
  basic_user_ungrouped,
  basic_user_ungrouped_manage_blocks,
} from "../../../tests/fixtures/users/fixtures";

const app = build_test_server([route_settings]);
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const unblock_route = `${route_settings.options.prefix}${get_route(route_schemas.unblock)}`;
test(`requests the ${unblock_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: unblock_route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${unblock_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: unblock_route,
    payload: unblock_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${unblock_route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: unblock_route,
    payload: unblock_valid,
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${unblock_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped_manage_blocks);

  const res = await app.inject({
    method: "POST",
    url: `${unblock_route}`,
    payload: unblock_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
//   expect(db_mock.remove_blocked_item).toHaveBeenCalledTimes(1);
//   expect(db_mock.remove_blocked_item).toHaveBeenCalledWith(
//     unblock_valid.doi,
//     basic_user_ungrouped_manage_blocks.entities.id,
// );
//   expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});