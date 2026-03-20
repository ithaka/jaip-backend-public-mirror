import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import { get_route } from "../../../utils/index.js";
import axios from "axios";
import {
  iac_credential_response,
  iac_account_response,
  valid_student_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_facility_without_permissions,
  basic_facility_with_dictionary,
} from "../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const prefix = route_settings.options.prefix;
const route = `${prefix}${get_route(route_schemas.headword_search)}`;
const make_url = (term: string) => route.replace(":term", term);

test("returns headwords for a valid search term", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_with_dictionary,
  );
  db_mock.get_headwords.mockResolvedValueOnce([
    ["apple", "application", "apply"],
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: make_url("app"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual(["apple", "application", "apply"]);
});

test("returns 400 when search term is too short", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_with_dictionary,
  );

  const res = await app.inject({
    method: "GET",
    url: make_url("a"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(400);
});

test("returns empty array when no headwords found", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_with_dictionary,
  );
  db_mock.get_headwords.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "GET",
    url: make_url("zzzzz"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual([]);
});

test("returns 500 when the database errors", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_with_dictionary,
  );
  db_mock.get_headwords.mockResolvedValueOnce([
    null,
    new Error("database error"),
  ]);

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(500);
});

test("returns 403 when facility lacks use_dictionary feature", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_without_permissions,
  );

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(403);
});

test("returns 200 when facility has use_dictionary feature", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_with_dictionary,
  );
  db_mock.get_headwords.mockResolvedValueOnce([["test"], null]);

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
});
