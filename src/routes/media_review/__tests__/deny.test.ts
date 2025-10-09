// NOTE: This file also includes tests for incomplete statuses. Denial and incomplete
// statuses currently use the same handler and have similar requirements.
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
  submit_denial_invalid,
  submit_denial_valid,
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
import { jstor_types, status_options } from "@prisma/client";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const deny_route = `${route_settings.options.prefix}${get_route(route_schemas.deny)}`;
test(`requests the ${deny_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: deny_route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${deny_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: deny_route,
    payload: submit_denial_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${deny_route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: deny_route,
    payload: submit_denial_valid,
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${deny_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: `${deny_route}`,
    payload: submit_denial_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(db_mock.create_statuses).toHaveBeenCalledTimes(1);
  expect(db_mock.create_statuses).toHaveBeenCalledWith(
    [
      expect.objectContaining({
        entity_id: basic_reviewer.entities.id,
        group_id: submit_denial_valid.groups[0],
        jstor_item_id: submit_denial_valid.doi,
        jstor_item_type: jstor_types.doi,
        status: status_options.Denied,
      }),
    ],
    submit_denial_valid.comments,
    submit_denial_valid.reason,
  );
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});

const incomplete_route = `${route_settings.options.prefix}${get_route(route_schemas.incomplete)}`;
test(`requests the ${incomplete_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: `${incomplete_route}`,
    payload: submit_denial_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.create_statuses).toHaveBeenCalledTimes(1);
  expect(db_mock.create_statuses).toHaveBeenCalledWith(
    [
      expect.objectContaining({
        entity_id: basic_reviewer.entities.id,
        group_id: submit_denial_valid.groups[0],
        jstor_item_id: submit_denial_valid.doi,
        jstor_item_type: jstor_types.doi,
        status: status_options.Incomplete,
      }),
    ],
    submit_denial_valid.comments,
    submit_denial_valid.reason,
  );
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});
