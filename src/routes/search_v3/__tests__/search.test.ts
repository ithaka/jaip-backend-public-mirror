import { afterEach, expect, test, vi } from "vitest";
import type { MockedFunction } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers";
import { get_route } from "../../../utils";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { CONTRIBUTED_CONTENT_FLAG } from "../../../consts";
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
  processed_search_response,
} from "../../../tests/fixtures/search/fixtures";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures";
import {
  basic_facility,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures";
import axios from "axios";
import { Search3Request } from "../../../types/search";

process.env.DB_MOCK = "true";

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
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, [], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
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
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, [], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response_with_bulk_statuses,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
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
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, [], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response_with_mixed_statuses,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
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
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, [], null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response_with_mixed_statuses_reviewer,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${search_route} route in reentry mode for a facility`, async () => {
  const reentry_payload = {
    ...search_request_valid,
    filters: [...search_request_valid.filters],
    facets: [...(search_request_valid.facets ?? [])],
    isReentry: true,
  };
  const collection_ids = ["collection-alpha", "collection-beta"];
  const limited_tokens = ["lv-token-1", "lv-token-2"];
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
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, limited_tokens, null]);
  db_mock.get_collection_ids.mockResolvedValueOnce([collection_ids, null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: reentry_payload,
  });

  const axiosPostMock = axios.post as MockedFunction<typeof axios.post>;
  const search_request = axiosPostMock.mock.calls[1][1] as Search3Request;
  const session_tokens =
    axios_session_data_with_email.data.data.sessionHttpHeaders.licenses.map(
      (license) => license.entitlement.id,
    );

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.statusCode).toEqual(200);
  expect(search_request.filter_queries).not.toContain(
    reentry_payload.filters[0],
  );
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);

  expect(search_request.tokens).toEqual(session_tokens);

  if (process.env.ENVIRONMENT !== "prod") {
    expect(db_mock.get_collection_ids).toHaveBeenCalledTimes(1);
    expect(search_request.content_set_flags).toContain(
      CONTRIBUTED_CONTENT_FLAG,
    );
    expect(search_request.limited_visibility_tokens).toEqual(limited_tokens);
    expect(search_request.filter_queries).toContain(
      `collection_ids:(${collection_ids.join(" OR ")})`,
    );
  } else {
    expect(db_mock.get_collection_ids).not.toHaveBeenCalled();
    expect(search_request.content_set_flags).not.toContain(
      CONTRIBUTED_CONTENT_FLAG,
    );
    expect(
      search_request.filter_queries.some((fq) =>
        fq.startsWith("collection_ids:"),
      ),
    ).toBe(false);
    expect(search_request.limited_visibility_tokens).toBeUndefined();
  }
});

test(`requests the ${search_route} route in reentry mode for a reviewer`, async () => {
  const reentry_payload = {
    ...search_request_valid,
    filters: [...search_request_valid.filters],
    facets: [...(search_request_valid.facets ?? [])],
    isReentry: true,
  };
  const collection_ids = ["collection-gamma"];
  const limited_tokens = ["reviewer-lv-token"];
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
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, limited_tokens, null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);
  db_mock.get_collection_ids.mockResolvedValueOnce([collection_ids, null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: reentry_payload,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  const axiosPostMock = axios.post as MockedFunction<typeof axios.post>;
  const search_request = axiosPostMock.mock.calls[1][1] as Search3Request;

  expect(res.statusCode).toEqual(200);
  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(search_request.filter_queries).not.toContain(
    reentry_payload.filters[0],
  );
  expect(search_request.tokens).toEqual(tokens);

  if (process.env.ENVIRONMENT !== "prod") {
    expect(search_request.content_set_flags).toContain(
      CONTRIBUTED_CONTENT_FLAG,
    );
    expect(search_request.limited_visibility_tokens).toEqual(limited_tokens);
    expect(search_request.filter_queries).toContain(
      `collection_ids:(${collection_ids.join(" OR ")})`,
    );

    expect(res.json()).toEqual({
      docs: processed_search_response_with_mixed_statuses_reviewer,
      total: search3_results.total,
    });
  } else {
    expect(search_request.content_set_flags).not.toContain(
      CONTRIBUTED_CONTENT_FLAG,
    );

    expect(
      search_request.filter_queries.some((fq) =>
        fq.startsWith("collection_ids:"),
      ),
    ).toBe(false);
    expect(search_request.limited_visibility_tokens).toBeUndefined();
  }
});
