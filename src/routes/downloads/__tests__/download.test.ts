import { afterEach, expect, test, describe, vi } from "vitest";

vi.mock("../../pages/helpers.js", () => ({
  get_s3_object: vi.fn(),
}));

import { get_s3_object } from "../../pages/helpers.js";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { get_route } from "../../../utils/index.js";
import { route_schemas } from "../schemas.js";
import { downloads_prefix } from "../options.js";
import { OFFLINE_INDICES } from "../../../consts/index.js";
import axios, { AxiosResponse } from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import { basic_reviewer } from "../../../tests/fixtures/users/fixtures.js";

process.env.DB_MOCK = "true";

const mocked_get_s3_object = vi.mocked(get_s3_object);
const app = build_test_server([route_settings]);
const download_route = `${route_settings.options.prefix}${get_route(route_schemas.download_offline_index)}`;
const download_url = (index_id: string) =>
  download_route.replace(":index_id", index_id);

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

test(`requests the ${download_route} route with a valid admin and streams ZIP file`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const mockStream = Buffer.from("mock zip file content");
  mocked_get_s3_object.mockResolvedValueOnce([
    mockStream as unknown as AxiosResponse,
    null,
  ]);

  const log_start = vi.spyOn(app.event_logger, "pep_standard_log_start");
  const log_complete = vi.spyOn(app.event_logger, "pep_standard_log_complete");

  const res = await app.inject({
    method: "GET",
    url: download_url("content_mac"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
  expect(mocked_get_s3_object).toHaveBeenCalledWith(
    `s3://ithaka-jaip/${process.env.ENVIRONMENT?.toLowerCase()}/offline_drive_downloads/with_content/JSTOR-Mac.zip`,
  );
  expect(log_start).toHaveBeenCalledTimes(1);
  expect(log_complete).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
  expect(res.headers["content-type"]).toContain("application/zip");
  expect(res.body).toEqual("mock zip file content");
});

test(`requests the ${download_route} route with invalid index_id and returns 400`, async () => {
  const res = await app.inject({
    method: "GET",
    url: download_url("invalid_index"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  // Authentication should not be called for invalid index_id
  expect(discover_mock).not.toHaveBeenCalled();
  expect(axios.post).not.toHaveBeenCalled();
  expect(db_mock.get_first_user).not.toHaveBeenCalled();
  expect(mocked_get_s3_object).not.toHaveBeenCalled();
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${download_route} route when S3 error occurs and returns 500`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const s3Error = new Error("S3 access denied");
  mocked_get_s3_object.mockResolvedValueOnce([null, s3Error]);

  const log_start = vi.spyOn(app.event_logger, "pep_standard_log_start");
  const log_error = vi.spyOn(app.event_logger, "pep_error");

  const res = await app.inject({
    method: "GET",
    url: download_url("content_windows"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
  expect(log_start).toHaveBeenCalledTimes(1);
  expect(log_error).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(500);
});

describe("Download Route Configuration", () => {
  test("route settings have correct structure", () => {
    expect(route_settings).toHaveProperty("routes");
    expect(route_settings).toHaveProperty("options");
    expect(route_settings.options.prefix).toBe(downloads_prefix);
    expect(typeof route_settings.routes).toBe("function");
  });

  test("downloads prefix matches expected path", () => {
    expect(downloads_prefix).toBe("/api/v2/download");
  });

  test("schema configuration is valid for offline index downloads", () => {
    const schema = route_schemas.download_offline_index;

    expect(schema.route).toBe("/offline/:index_id");
    expect(schema.description).toContain("pre-signed S3 URL");
    expect(schema.params.properties.index_id.enum).toEqual(
      Object.keys(OFFLINE_INDICES),
    );

    const response200 = schema.response[200];
    expect(response200.required).toEqual([
      "download_url",
      "filename",
      "expires_in",
    ]);
  });
});
