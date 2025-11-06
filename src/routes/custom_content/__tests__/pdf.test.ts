import { afterEach, expect, test, vi } from "vitest";

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
import axios, { AxiosError, AxiosResponse } from "axios";
import {
  axios_session_data_with_code,
  axios_session_data_with_email,
  valid_admin_subdomain,
  valid_student_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_facility,
  basic_facility_without_permissions,
  basic_reviewer,
  basic_user_ungrouped,
  media_review_permissions,
} from "../../../tests/fixtures/users/fixtures.js";

process.env.DB_MOCK = "true";

const mocked_get_s3_object = vi.mocked(get_s3_object);
const app = build_test_server([route_settings]);
const pdf_route = `${route_settings.options.prefix}${get_route(route_schemas.get_pdf)}`;
const pdf_url = (collection: string, filename: string) =>
  pdf_route.replace(":collection", collection).replace(":filename", filename);

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

test(`requests the ${pdf_route} route with a valid admin`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  mocked_get_s3_object.mockResolvedValueOnce([
    Buffer.from("pdf") as unknown as AxiosResponse,
    null,
  ]);
  const log_start = vi.spyOn(app.event_logger, "pep_standard_log_start");
  const log_complete = vi.spyOn(app.event_logger, "pep_standard_log_complete");

  const res = await app.inject({
    method: "GET",
    url: pdf_url("reentry", "ny-connections-2025.pdf"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).not.toHaveBeenCalled();
  expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
  expect(log_start).toHaveBeenCalledTimes(1);
  expect(log_complete).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
  expect(res.headers["content-type"]).toContain("application/pdf");
});

test(`requests the ${pdf_route} route with an admin lacking required features`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);

  const res = await app.inject({
    method: "GET",
    url: pdf_url("reentry", "ny-connections-2025.pdf"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(mocked_get_s3_object).not.toHaveBeenCalled();
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${pdf_route} route with a valid facility`, async () => {
  const facility_with_access = {
    ...basic_facility,
    entities: {
      ...basic_facility.entities,
      features_groups_entities: [
        ...basic_facility.entities.features_groups_entities,
        ...media_review_permissions(true),
      ],
    },
  };

  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_code);
  db_mock.get_first_facility.mockResolvedValueOnce(facility_with_access);
  mocked_get_s3_object.mockResolvedValueOnce([
    Buffer.from("pdf") as unknown as AxiosResponse,
    null,
  ]);
  const log_start = vi.spyOn(app.event_logger, "pep_standard_log_start");
  const log_complete = vi.spyOn(app.event_logger, "pep_standard_log_complete");

  const res = await app.inject({
    method: "GET",
    url: pdf_url("reentry", "ny-connections-2025.pdf"),
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).not.toHaveBeenCalled();
  expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
  expect(log_start).toHaveBeenCalledTimes(1);
  expect(log_complete).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
  expect(res.headers["content-type"]).toContain("application/pdf");
});

test(`requests the ${pdf_route} route with a facility lacking required features`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_code);
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_without_permissions,
  );

  const res = await app.inject({
    method: "GET",
    url: pdf_url("reentry", "ny-connections-2025.pdf"),
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(mocked_get_s3_object).not.toHaveBeenCalled();
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${pdf_route} route when the pdf is unavailable`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  const axios_error = new AxiosError("not found", AxiosError.ERR_BAD_REQUEST);
  axios_error.code = AxiosError.ERR_BAD_REQUEST;
  mocked_get_s3_object.mockResolvedValueOnce([null, axios_error]);
  const log_error = vi.spyOn(app.event_logger, "pep_error");

  const res = await app.inject({
    method: "GET",
    url: pdf_url("reentry", "ny-connections-2025.pdf"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(mocked_get_s3_object).toHaveBeenCalledTimes(1);
  expect(log_error).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(404);
  expect(res.json()).toStrictEqual({ status: 404 });
});
