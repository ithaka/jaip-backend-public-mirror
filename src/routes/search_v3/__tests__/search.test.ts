import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers";
import { get_route } from "../../../utils";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import {
  bulk_statuses,
  item_statuses,
  processed_search_response_with_bulk_statuses,
  processed_search_response_with_mixed_statuses,
  processed_search_response_with_mixed_statuses_reviewer,
  search3_results,
  search_request_invalid,
  search_request_valid,
  tokens,
} from "../../../tests/fixtures/search/fixtures";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures";
import {
  basic_facility,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures";
import { processed_search_response } from "../../../tests/fixtures/search/fixtures";
import axios from "axios";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const search_route = `${route_settings.options.prefix}${get_route(route_schemas.search)}`;
test(`requests the ${search_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: search_route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${search_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${search_route} route with a facility and valid body and no statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  db_mock.get_statuses
    .mockResolvedValueOnce([[], null])
    .mockResolvedValueOnce([[], null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  if (process.env.ENVIRONMENT !== "prod") {
    expect(discover_mock).toHaveBeenCalledTimes(2);
    expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(0);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(res.json()).toEqual({
      docs: processed_search_response,
      total: search3_results.total,
    });
    expect(res.statusCode).toEqual(200);
  } else {
    expect(res.statusCode).toEqual(403);
  }
});

test(`requests the ${search_route} route with a facility and valid body and bulk statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  db_mock.get_statuses
    .mockResolvedValueOnce([bulk_statuses, null])
    .mockResolvedValueOnce([[], null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  if (process.env.ENVIRONMENT !== "prod") {
    expect(discover_mock).toHaveBeenCalledTimes(2);
    expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(0);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(res.json()).toEqual({
      docs: processed_search_response_with_bulk_statuses,
      total: search3_results.total,
    });
    expect(res.statusCode).toEqual(200);
  } else {
    expect(res.statusCode).toEqual(403);
  }
});

// NOTE: This test also verifies that a bulk approval status is overridden by an item status.
test(`requests the ${search_route} route with a facility and valid body and both bulk and item status`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  db_mock.get_statuses
    .mockResolvedValueOnce([bulk_statuses, null])
    .mockResolvedValueOnce([item_statuses, null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  if (process.env.ENVIRONMENT !== "prod") {
    expect(discover_mock).toHaveBeenCalledTimes(2);
    expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(0);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(res.json()).toEqual({
      docs: processed_search_response_with_mixed_statuses,
      total: search3_results.total,
    });
    expect(res.statusCode).toEqual(200);
  } else {
    expect(res.statusCode).toEqual(403);
  }
});

test(`requests the ${search_route} route with a reviewer and valid body and both bulk and item statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.get_statuses
    .mockResolvedValueOnce([bulk_statuses, null])
    .mockResolvedValueOnce([item_statuses, null]);
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  if (process.env.ENVIRONMENT !== "prod") {
    expect(discover_mock).toHaveBeenCalledTimes(2);
    expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(res.json()).toEqual({
      docs: processed_search_response_with_mixed_statuses_reviewer,
      total: search3_results.total,
    });
    expect(res.statusCode).toEqual(200);
  } else {
    expect(res.statusCode).toEqual(403);
  }
});
