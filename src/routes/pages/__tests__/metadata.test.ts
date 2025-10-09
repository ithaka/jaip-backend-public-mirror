import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { metadata_prefix } from "../schemas.js";
import {
  ale_response,
  approved_discipline_response,
  approved_item_response,
  approved_journal_response,
  cedar_item_view_response,
  denied_item_response,
  iid_path,
  metadata_response_allowed,
  metadata_response_forbidden,
} from "../../../tests/fixtures/pages/fixtures.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
  valid_student_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_facility,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const metadata_route = `${route_settings.options.prefix}${metadata_prefix}${iid_path}`;
test(`requests the ${metadata_route}" route without a user or facility`, async () => {
  const res = await app.inject({
    method: "GET",
    url: metadata_route,
  });
  expect(res.statusCode).toEqual(500);
});

test(`requests the ${metadata_route} route with a facility and no status`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi.fn().mockResolvedValueOnce({
    status: 200,
    data: cedar_item_view_response,
  });
  db_mock.get_item_status.mockResolvedValue([null, null]);
  db_mock.get_statuses.mockResolvedValue([[], null]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_forbidden);
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(db_mock.get_statuses).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${metadata_route} route with a facility and item approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });
  db_mock.get_item_status.mockResolvedValueOnce([approved_item_response, null]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${metadata_route} route with a facility and discipline approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });
  db_mock.get_item_status.mockResolvedValueOnce([null, null]);
  db_mock.get_statuses.mockResolvedValueOnce([
    [approved_discipline_response],
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(db_mock.get_statuses).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${metadata_route} route with a facility and journal approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });
  db_mock.get_item_status.mockResolvedValueOnce([null, null]);
  db_mock.get_statuses.mockResolvedValueOnce([
    [approved_journal_response],
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(db_mock.get_statuses).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${metadata_route} route with a facility and denied status`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi.fn().mockResolvedValueOnce({
    status: 200,
    data: cedar_item_view_response,
  });

  db_mock.get_item_status.mockResolvedValueOnce([denied_item_response, null]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_forbidden);
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${metadata_route} route with an admin and item approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(200);
});
