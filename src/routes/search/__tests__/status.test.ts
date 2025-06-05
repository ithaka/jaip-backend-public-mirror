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
  processed_search_response_with_mixed_statuses_and_status_order,
  processed_search_response_with_mixed_statuses_reviewer_and_status_order,
  search3_results,
  search_status_results,
  status_search_request_invalid,
  status_search_request_valid,
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
import axios from "axios";
import { status_options } from "@prisma/client";

const app = build_test_server([route_settings]);
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const base_route = `${route_settings.options.prefix}${get_route(route_schemas.search)}`;
const status_route_approved = `${base_route}${status_options.Approved}`;
const status_route_denied = `${base_route}${status_options.Denied}`;
const status_route_pending = `${base_route}${status_options.Pending}`;
const status_route_incomplete = `${base_route}${status_options.Incomplete}`;
const status_route_completed = `${base_route}completed`;

const routes = [
  status_route_approved,
  status_route_denied,
  status_route_pending,
  status_route_incomplete,
  status_route_completed,
];
test.each(routes)(`requests the %s route with no body`, async (route) => {
  const res = await app.inject({
    method: "POST",
    url: route,
  });
  expect(res.statusCode).toEqual(400);
});

test.each(routes)(`requests the %s route with invalid body`, async (route) => {
  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: status_search_request_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test.each(routes)(
  `requests the %s route with a facility and valid body and no statuses to find`,
  async (route) => {
    discover_mock
      .mockName("discover")
      .mockResolvedValue(["this text doesn't matter", null]);
    axios.post = jest
      .fn()
      .mockName("axios_post")
      .mockResolvedValueOnce(axios_session_data_with_email)
      .mockResolvedValueOnce({
        status: 200,
        data: search3_results,
      });
    db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
    db_mock.get_search_statuses.mockResolvedValueOnce([[], 0, null]);

    const res = await app.inject({
      method: "POST",
      url: `${route}`,
      payload: status_search_request_valid,
    });

    expect(discover_mock).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(db_mock.get_search_statuses).toHaveBeenCalledTimes(1);
    expect(res.json()).toEqual({
      docs: [],
      total: 0,
    });
    expect(res.statusCode).toEqual(200);
  },
);

// This only needs to be checked once, because we're providing the same request and response data and the flow should
// be identical for all the routes. This is basically just verifying that the search handler is working,
// which is already tested in the search.test.ts file.
test(`requests the ${status_route_approved} route with a facility and valid body and statuses`, async () => {
  discover_mock
    .mockName("discover")
    .mockResolvedValue(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockName("axios_post")
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  db_mock.get_search_statuses.mockResolvedValueOnce([
    search_status_results,
    0,
    null,
  ]);
  db_mock.get_statuses
    .mockResolvedValueOnce([bulk_statuses, null])
    .mockResolvedValueOnce([item_statuses, null]);

  const res = await app.inject({
    method: "POST",
    url: `${status_route_approved}`,
    payload: status_search_request_valid,
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(db_mock.get_search_statuses).toHaveBeenCalledTimes(1);
  expect(db_mock.get_statuses).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response_with_mixed_statuses_and_status_order,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${status_route_approved} route with a reviewer and valid body and statuses`, async () => {
  discover_mock
    .mockName("discover")
    .mockResolvedValue(["this text doesn't matter", null]);
  axios.post = jest
    .fn()
    .mockName("axios_post")
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.get_search_statuses.mockResolvedValueOnce([
    search_status_results,
    0,
    null,
  ]);
  db_mock.get_statuses
    .mockResolvedValueOnce([bulk_statuses, null])
    .mockResolvedValueOnce([item_statuses, null]);
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, null]);

  const res = await app.inject({
    method: "POST",
    url: `${status_route_approved}`,
    payload: status_search_request_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);
  expect(db_mock.get_search_statuses).toHaveBeenCalledTimes(1);
  expect(db_mock.get_statuses).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response_with_mixed_statuses_reviewer_and_status_order,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
});
