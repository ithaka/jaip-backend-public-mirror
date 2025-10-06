import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { get_route } from "../../../utils";
import {
  submit_bulk_undo_invalid,
  submit_bulk_undo_valid,
} from "../../../tests/fixtures/media_review/requests/fixtures";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures";
import {
  basic_reviewer,
  basic_user_ungrouped,
} from "../../../tests/fixtures/users/fixtures";
import { jstor_types, status_options } from "@prisma/client";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const bulk_undo_route = `${route_settings.options.prefix}${get_route(route_schemas.bulk_undo)}`;
test(`requests the ${bulk_undo_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: bulk_undo_route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${bulk_undo_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: bulk_undo_route,
    payload: submit_bulk_undo_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${bulk_undo_route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: bulk_undo_route,
    payload: submit_bulk_undo_valid,
  });
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${bulk_undo_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.remove_bulk_approval.mockResolvedValueOnce([
    [
      {
        id: 1,
        entity_id: basic_reviewer.entities.id,
        jstor_item_id: submit_bulk_undo_valid.code,
        jstor_item_type: jstor_types.discipline,
        status: status_options.Denied,
        group_id: submit_bulk_undo_valid.groups[0],
      },
    ],
    null,
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${bulk_undo_route}`,
    payload: submit_bulk_undo_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.remove_bulk_approval).toHaveBeenCalledTimes(1);
  expect(db_mock.remove_bulk_approval).toHaveBeenCalledWith(
    submit_bulk_undo_valid.code,
    submit_bulk_undo_valid.groups,
    basic_reviewer.entities.id,
  );
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});
