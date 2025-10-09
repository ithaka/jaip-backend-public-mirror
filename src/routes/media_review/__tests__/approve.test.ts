import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import { get_route } from "../../../utils/index.js";
import {
  submit_approval_invalid,
  submit_approval_valid,
} from "../../../tests/fixtures/media_review/requests/fixtures.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_reviewer,
  basic_user_ungrouped,
} from "../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const approve_route = `${route_settings.options.prefix}${get_route(route_schemas.approve)}`;
test(`requests the ${approve_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: approve_route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${approve_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: approve_route,
    payload: submit_approval_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${approve_route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: approve_route,
    payload: submit_approval_valid,
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${approve_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: `${approve_route}`,
    payload: submit_approval_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.create_approvals).toHaveBeenCalledTimes(1);
  expect(db_mock.create_approvals).toHaveBeenCalledWith(
    submit_approval_valid.doi,
    submit_approval_valid.groups,
    basic_reviewer.entities.id,
  );
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});
