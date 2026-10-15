import { afterEach, expect, test, vi } from "vitest";
import axios from "axios";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_reviewer,
  basic_ithaka_admin,
  facilities_for_user,
} from "../../../tests/fixtures/users/fixtures.js";
import { get_route } from "../../../utils/index.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.resetAllMocks();
});

const route = `${route_settings.options.prefix}${get_route(route_schemas.delete_request_permissions)}`;
const facility_id = facilities_for_user[0].entities.id;

const authenticate_manage_facility_admin = (
  manageable_facilities = [facilities_for_user[0]],
) => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_ithaka_admin);
  db_mock.get_facilities.mockResolvedValueOnce([manageable_facilities, null]);
};

test("deletes a request permission for a manageable facility", async () => {
  authenticate_manage_facility_admin();
  db_mock.remove_request_permission.mockResolvedValueOnce(null);

  const response = await app.inject({
    method: "DELETE",
    url: route,
    headers: { host: valid_admin_subdomain },
    payload: { facility_id },
  });

  expect(response.statusCode).toBe(204);
  expect(db_mock.remove_request_permission).toHaveBeenCalledWith(facility_id);
});

test("rejects deleting a permission for a facility the admin cannot manage", async () => {
  authenticate_manage_facility_admin([]);

  const response = await app.inject({
    method: "DELETE",
    url: route,
    headers: { host: valid_admin_subdomain },
    payload: { facility_id },
  });

  expect(response.statusCode).toBe(403);
  expect(db_mock.remove_request_permission).not.toHaveBeenCalled();
});

test("blocks users without manage_facilities or edit_facilities permission", async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.get_facilities.mockResolvedValueOnce([[], null]);

  const response = await app.inject({
    method: "DELETE",
    url: route,
    headers: { host: valid_admin_subdomain },
    payload: { facility_id },
  });

  expect(response.statusCode).toBe(403);
  expect(db_mock.remove_request_permission).not.toHaveBeenCalled();
});
