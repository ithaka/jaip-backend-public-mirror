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

const route = `${route_settings.options.prefix}${get_route(route_schemas.edit_request_permissions)}`;
const facility_id = facilities_for_user[0].entities.id;
const start_date = "2026-10-01T00:00:00.000Z";
const end_date = "2026-10-31T23:59:59.000Z";
const permission = {
  id: 55,
  facility_id,
  admin_id: basic_ithaka_admin.entities.id,
  start_date: new Date(start_date),
  end_date: new Date(end_date),
};

const authenticate_manage_facility_admin = (
  manageable_facilities = [facilities_for_user[0]],
) => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_ithaka_admin);
  db_mock.get_facilities.mockResolvedValueOnce([manageable_facilities, null]);
};

test("updates an existing request permission for a manageable facility", async () => {
  authenticate_manage_facility_admin();
  db_mock.update_request_permission.mockResolvedValueOnce([permission, null]);

  const response = await app.inject({
    method: "PATCH",
    url: route,
    headers: { host: valid_admin_subdomain },
    payload: { facility_id, start_date, end_date },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({
    ...permission,
    start_date,
    end_date,
  });
  expect(db_mock.update_request_permission).toHaveBeenCalledWith({
    where: { facility_id },
    data: {
      admin_id: basic_ithaka_admin.entities.id,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      updated_at: expect.any(Date),
    },
  });
});

test("rejects an invalid updated date range without writing", async () => {
  authenticate_manage_facility_admin();

  const response = await app.inject({
    method: "PATCH",
    url: route,
    headers: { host: valid_admin_subdomain },
    payload: {
      facility_id,
      start_date: "2026-11-01T00:00:00.000Z",
      end_date: "2026-10-01T00:00:00.000Z",
    },
  });

  expect(response.statusCode).toBe(400);
  expect(db_mock.update_request_permission).not.toHaveBeenCalled();
});

test("blocks users without manage_facilities or edit_facilities permission", async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.get_facilities.mockResolvedValueOnce([[], null]);

  const response = await app.inject({
    method: "PATCH",
    url: route,
    headers: { host: valid_admin_subdomain },
    payload: { facility_id, start_date, end_date },
  });

  expect(response.statusCode).toBe(403);
  expect(db_mock.update_request_permission).not.toHaveBeenCalled();
});
