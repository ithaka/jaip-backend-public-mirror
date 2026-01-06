import { afterEach, expect, test, vi } from "vitest";

vi.mock("../helpers.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../helpers.js")>();
  return {
    ...actual,
    get_s3_object: vi.fn(),
  };
});
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { page_prefix } from "../schemas.js";
import {
  ale_response,
  approved_discipline_response,
  approved_item_response,
  approved_journal_response,
  cedar_item_view_response,
  cedar_item_view_without_page_images,
  denied_item_response,
  iid_path,
  mock_image_response,
} from "../../../tests/fixtures/pages/fixtures.js";
import axios from "axios";
import { get_s3_object } from "../helpers.js";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
  valid_student_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_facility,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures.js";

const mocked_get_s3_object = vi.mocked(get_s3_object);

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// NOTE: The tests for the page route and the pdf route are the same, because we're supplying
// a mock response for the s3 bucket anyway, and that and the page number are the only distinctions
const page_route = `${route_settings.options.prefix}${page_prefix}${iid_path}/0`;
const pdf_route = `${route_settings.options.prefix}${page_prefix}${iid_path}`;
const routes = [page_route, pdf_route];

test.each(routes)(
  `requests the %s route without a user or facility`,
  async (route) => {
    const res = await app.inject({
      method: "GET",
      url: route,
    });
    expect(res.statusCode).toEqual(500);
  },
);

test.each(routes)(
  `requests the %s route with a facility and no status`,
  async (route) => {
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
      url: route,
      headers: {
        host: valid_student_subdomain,
      },
    });

    expect(res.payload).toStrictEqual("");
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
    expect(db_mock.get_statuses).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toEqual(403);
  },
);

test.each(routes)(
  `requests the $%s route with a facility and item approval`,
  async (route) => {
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
    mocked_get_s3_object.mockResolvedValueOnce([
      Buffer.from(mock_image_response.data) as unknown as NodeJS.ReadableStream,
      null,
    ]);

    db_mock.get_item_status.mockResolvedValueOnce([
      approved_item_response,
      null,
    ]);

    const res = await app.inject({
      method: "GET",
      url: route,
      headers: {
        host: valid_student_subdomain,
      },
    });

    expect(res.payload).toStrictEqual(mock_image_response.data);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
    expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toEqual(200);
  },
);

test.each(routes)(
  `requests the %s route with a facility and discipline approval`,
  async (route) => {
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
    mocked_get_s3_object.mockResolvedValueOnce([
      Buffer.from(mock_image_response.data) as unknown as NodeJS.ReadableStream,
      null,
    ]);

    db_mock.get_item_status.mockResolvedValueOnce([null, null]);
    db_mock.get_statuses.mockResolvedValueOnce([
      [approved_discipline_response],
      null,
    ]);

    const res = await app.inject({
      method: "GET",
      url: route,
      headers: {
        host: valid_student_subdomain,
      },
    });

    expect(res.payload).toStrictEqual(mock_image_response.data);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
    expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
    expect(db_mock.get_statuses).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toEqual(200);
  },
);

test.each(routes)(
  `requests the %s route with a facility and journal approval`,
  async (route) => {
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
    mocked_get_s3_object.mockResolvedValueOnce([
      Buffer.from(mock_image_response.data) as unknown as NodeJS.ReadableStream,
      null,
    ]);

    db_mock.get_item_status.mockResolvedValueOnce([null, null]);
    db_mock.get_statuses.mockResolvedValueOnce([
      [approved_journal_response],
      null,
    ]);

    const res = await app.inject({
      method: "GET",
      url: route,
      headers: {
        host: valid_student_subdomain,
      },
    });

    expect(res.payload).toStrictEqual(mock_image_response.data);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
    expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
    expect(db_mock.get_statuses).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toEqual(200);
  },
);

test.each(routes)(
  `requests the %s route with a facility and denied status`,
  async (route) => {
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
      url: route,
      headers: {
        host: valid_student_subdomain,
      },
    });

    expect(res.payload).toStrictEqual("");
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toEqual(403);
  },
);

test.each(routes)(
  `requests the %s route with an admin and item approval`,
  async (route) => {
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
    mocked_get_s3_object.mockResolvedValueOnce([
      Buffer.from(mock_image_response.data) as unknown as NodeJS.ReadableStream,
      null,
    ]);

    const res = await app.inject({
      method: "GET",
      url: route,
      headers: {
        host: valid_admin_subdomain,
      },
    });

    expect(res.payload).toStrictEqual(mock_image_response.data);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
    expect(db_mock.get_item_status).toHaveBeenCalledTimes(0);
    expect(res.statusCode).toEqual(200);
  },
);

test(`requests the ${page_route} route when metadata lacks page images`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  axios.get = vi.fn().mockResolvedValueOnce({
    status: 200,
    data: cedar_item_view_without_page_images,
  });

  const res = await app.inject({
    method: "GET",
    url: page_route,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(500);
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(db_mock.get_item_status).not.toHaveBeenCalled();
  expect(res.payload).toContain("Page 0 not found");
});
