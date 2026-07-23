import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../tests/helpers.js";
import route_settings from "./routes.js";
import { route_schemas } from "./schemas.js";
import { get_route } from "../../utils/index.js";
import {
  iac_account_response,
  iac_credential_response,
  valid_student_subdomain,
} from "../../tests/fixtures/auth/fixtures.js";
import { basic_facility } from "../../tests/fixtures/users/fixtures.js";
import {
  cedar_csl_response,
  expected_citation_response,
} from "../../tests/fixtures/citations/fixtures.js";
import axios from "axios";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
const route = `${prefix}${get_route(route_schemas.citations)}`;

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.useRealTimers();
});

test(`requests the ${route} route without an authenticated user`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({ data: {}, status: 200 }) as typeof axios.get;
  db_mock.get_ip_bypass.mockResolvedValueOnce(null);

  const res = await app.inject({
    method: "GET",
    url: `${prefix}/test-iid`,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(401);
});

test(`requests the ${route} route with an authenticated facility and returns citations`, async () => {
  // Pin the clock so the "Accessed <date>." suffix in the generated citations
  // is deterministic and matches the fixture.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));

  discover_mock
    .mockResolvedValueOnce(["this text doesn't matter", null])
    .mockResolvedValueOnce(["this text doesn't matter", null]);

  axios.get = vi
    .fn()
    .mockResolvedValueOnce(iac_credential_response)
    .mockResolvedValueOnce(iac_account_response)
    .mockResolvedValueOnce({
      status: 200,
      data: { ...cedar_csl_response },
    }) as typeof axios.get;

  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "GET",
    url: `${prefix}/test-iid`,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(axios.get).toHaveBeenCalledTimes(3);
  expect(res.json()).toStrictEqual(expected_citation_response);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route and returns 404 when Cedar has no citation data`, async () => {
  discover_mock
    .mockResolvedValueOnce(["this text doesn't matter", null])
    .mockResolvedValueOnce(["this text doesn't matter", null]);

  axios.get = vi
    .fn()
    .mockResolvedValueOnce(iac_credential_response)
    .mockResolvedValueOnce(iac_account_response)
    .mockResolvedValueOnce({
      status: 404,
      data: {},
    }) as typeof axios.get;

  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "GET",
    url: `${prefix}/test-iid`,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(404);
  expect(res.json()).toStrictEqual({});
});

test(`requests the ${route} route and returns a 200 error body on a Cedar non-200 response`, async () => {
  discover_mock
    .mockResolvedValueOnce(["this text doesn't matter", null])
    .mockResolvedValueOnce(["this text doesn't matter", null]);

  axios.get = vi
    .fn()
    .mockResolvedValueOnce(iac_credential_response)
    .mockResolvedValueOnce(iac_account_response)
    .mockResolvedValueOnce({
      status: 503,
      data: {},
    }) as typeof axios.get;

  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "GET",
    url: `${prefix}/test-iid`,
    headers: {
      host: valid_student_subdomain,
    },
  });

  // The handler intentionally responds 200 with an error body so the frontend
  // can display the failure gracefully rather than treating it as a hard error.
  expect(res.statusCode).toEqual(200);
  expect(res.json()).toStrictEqual({
    has_error: true,
    error_message: "Citation request failed: unable to retrieve metadata.",
  });
});

test(`requests the ${route} route and returns 500 when Cedar service discovery fails`, async () => {
  const cedar_discovery_error = new Error("failed to discover cedar");

  discover_mock
    .mockResolvedValueOnce(["this text doesn't matter", null])
    .mockResolvedValueOnce(["", cedar_discovery_error]);

  axios.get = vi
    .fn()
    .mockResolvedValueOnce(iac_credential_response)
    .mockResolvedValueOnce(iac_account_response) as typeof axios.get;

  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "GET",
    url: `${prefix}/test-iid`,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(500);
  expect(res.body).toContain("failed to discover cedar");
});

test(`requests the ${route} route and returns a 200 error body when citation generation fails`, async () => {
  discover_mock
    .mockResolvedValueOnce(["this text doesn't matter", null])
    .mockResolvedValueOnce(["this text doesn't matter", null]);

  // Cedar responds 200 but with a payload that cannot be turned into a citation,
  // so generate_citations reports an error. The handler passes that result
  // straight through as a 200 with has_error set.
  axios.get = vi
    .fn()
    .mockResolvedValueOnce(iac_credential_response)
    .mockResolvedValueOnce(iac_account_response)
    .mockResolvedValueOnce({
      status: 200,
      data: "not-valid-csl",
    }) as typeof axios.get;

  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "GET",
    url: `${prefix}/test-iid`,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  expect(body.has_error).toBe(true);
  expect(body.error_message).toEqual(expect.any(String));
  expect(body.error_message.length).toBeGreaterThan(0);
  expect(body.apa).toEqual("");
  expect(body.mla).toEqual("");
  expect(body.chicago).toEqual("");
});

test(`requests the ${route} route and returns 500 when Cedar request throws`, async () => {
  const cedar_error = new Error("cedar request timed out");

  discover_mock
    .mockResolvedValueOnce(["this text doesn't matter", null])
    .mockResolvedValueOnce(["this text doesn't matter", null]);

  axios.get = vi
    .fn()
    .mockResolvedValueOnce(iac_credential_response)
    .mockResolvedValueOnce(iac_account_response)
    .mockRejectedValueOnce(cedar_error) as typeof axios.get;

  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "GET",
    url: `${prefix}/test-iid`,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(500);
  expect(res.body).toContain("cedar request timed out");
});

test(`requests the ${route} route without an iid path segment`, async () => {
  const res = await app.inject({
    method: "GET",
    url: prefix,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.statusCode).toEqual(404);
});
