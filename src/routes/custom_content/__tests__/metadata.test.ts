import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { get_route } from "../../../utils/index.js";
import { route_schemas } from "../schemas.js";
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
import axios from "axios";
import { CUSTOM_CONTENT_METADATA } from "../../../consts/index.js";

process.env.DB_MOCK = "true";

const app = build_test_server([route_settings]);
const metadata_route = `${route_settings.options.prefix}${get_route(route_schemas.get_metadata)}`;

const metadata_url = (collection: string) =>
  metadata_route.replace(":collection", collection);

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

test(`requests the ${metadata_route} route with a facility and no permissions`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_code);
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_without_permissions,
  );
  const log_start = vi.spyOn(app.event_logger, "pep_standard_log_start");

  const res = await app.inject({
    method: "GET",
    url: metadata_url("reentry"),
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).not.toHaveBeenCalled();
  expect(log_start).not.toHaveBeenCalled();
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${metadata_route} route with an admin and no features`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  const log_start = vi.spyOn(app.event_logger, "pep_standard_log_start");

  const res = await app.inject({
    method: "GET",
    url: metadata_url("reentry"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(log_start).not.toHaveBeenCalled();
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${metadata_route} route with a valid admin`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  const log_start = vi.spyOn(app.event_logger, "pep_standard_log_start");
  const log_complete = vi.spyOn(app.event_logger, "pep_standard_log_complete");

  const res = await app.inject({
    method: "GET",
    url: metadata_url("reentry"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(log_start).toHaveBeenCalledTimes(1);
  expect(log_complete).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual(CUSTOM_CONTENT_METADATA.reentry);
});

test(`requests the ${metadata_route} route with a valid facility`, async () => {
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
  const log_start = vi.spyOn(app.event_logger, "pep_standard_log_start");
  const log_complete = vi.spyOn(app.event_logger, "pep_standard_log_complete");

  const res = await app.inject({
    method: "GET",
    url: metadata_url("reentry"),
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).not.toHaveBeenCalled();
  expect(log_start).toHaveBeenCalledTimes(1);
  expect(log_complete).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual(CUSTOM_CONTENT_METADATA.reentry);
});

test(`requests the ${metadata_route} route with an invalid collection`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  const log_error = vi.spyOn(app.event_logger, "pep_error");

  const res = await app.inject({
    method: "GET",
    url: metadata_url("missing"),
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(log_error).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(400);
  expect(res.body).toEqual("Collection metadata not found for missing");
});
