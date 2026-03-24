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
  basic_facility,
  basic_facility_with_dictionary,
} from "../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const prefix = route_settings.options.prefix;
const route = `${prefix}${get_route(route_schemas.word_search)}`;
const make_url = (term: string) => route.replace(":term", term);

const mock_rate_limit_headers = {
  "x-ratelimit-remaining-hour": "950",
  "x-ratelimit-remaining-minute": "14",
  "x-ratelimit-limit-minute": "15",
  "x-ratelimit-limit-hour": "1000",
};

const mock_etymologies_response = [
  {
    etymologyXML: "<ety>From Latin <i>testum</i></ety>",
    sourceDictionary: "ahd-5",
    id: "T0128800-1",
  },
];

const mock_pronunciations_response = [
  {
    raw: "tĕst",
    attributionText: "from The American Heritage Dictionary",
    id: "T0128800-P1",
  },
];

const mock_definitions_response = [
  {
    partOfSpeech: "noun",
    attributionText: "from The American Heritage Dictionary",
    text: "A procedure for critical evaluation.",
    word: "test",
    id: "T0128800-D1",
  },
  {
    partOfSpeech: "verb",
    attributionText: "from The American Heritage Dictionary",
    text: "To subject to a test.",
    word: "test",
    id: "T0128800-D2",
  },
];

const make_wordnik_response = (data: unknown) => ({
  data,
  headers: mock_rate_limit_headers,
  status: 200,
});

const setup_word_search_mocks = (
  etymologies: typeof mock_etymologies_response = mock_etymologies_response,
  pronunciations: typeof mock_pronunciations_response = mock_pronunciations_response,
  definitions: Array<{
    partOfSpeech: string;
    attributionText: string;
    text: string | string[];
    word: string;
    id: string;
  }> = mock_definitions_response,
) => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  axios.get = vi
    .fn()
    // Auth calls
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response)
    // Wordnik calls (etymologies, pronunciations, definitions run in parallel via Promise.all)
    .mockResolvedValueOnce(make_wordnik_response(etymologies))
    .mockResolvedValueOnce(make_wordnik_response(pronunciations))
    .mockResolvedValueOnce(
      make_wordnik_response(definitions),
    ) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_with_dictionary,
  );
};

test("returns word data with etymologies, pronunciations, and definitions", async () => {
  setup_word_search_mocks();

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  expect(body).toHaveProperty("etymologies");
  expect(body).toHaveProperty("pronunciations");
  expect(body).toHaveProperty("definitions");
  expect(body.etymologies.is_error).toBe(false);
  expect(body.pronunciations.is_error).toBe(false);
  expect(body.definitions.is_error).toBe(false);
  expect(body.definitions.response).toHaveLength(2);
  expect(body.pronunciations.response).toHaveLength(1);
  expect(body.etymologies.response).toHaveLength(1);
});

test("filters XML tags from etymologies, keeping only <i> and <div>", async () => {
  const etymologies_with_xml = [
    {
      etymologyXML:
        '<ety><tt>bold</tt> text and <div class="section">content</div> and <span>removed</span></ety>',
      sourceDictionary: "ahd-5",
      id: "E1",
    },
  ];
  setup_word_search_mocks(etymologies_with_xml);

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  const xml = body.etymologies.response[0].etymologyXML;
  // <tt> replaced with <i>, <ety> and <span> stripped, <div> kept
  expect(xml).toContain("<i>");
  expect(xml).toContain("</i>");
  expect(xml).toContain("<div");
  expect(xml).not.toContain("<tt>");
  expect(xml).not.toContain("<ety>");
  expect(xml).not.toContain("<span>");
});

test("removes empty definitions from response", async () => {
  const definitions_with_empty = [
    {
      partOfSpeech: "noun",
      attributionText: "from AHD",
      text: "A valid definition.",
      word: "test",
      id: "D1",
    },
    {
      partOfSpeech: "verb",
      attributionText: "from AHD",
      text: "   ",
      word: "test",
      id: "D2",
    },
    {
      partOfSpeech: "adjective",
      attributionText: "from AHD",
      text: "",
      word: "test",
      id: "D3",
    },
  ];
  setup_word_search_mocks(undefined, undefined, definitions_with_empty);

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  expect(body.definitions.response).toHaveLength(1);
  expect(body.definitions.response[0].text).toBe("A valid definition.");
});

test("removes definitions with array text values", async () => {
  const definitions_with_array_text = [
    {
      partOfSpeech: "noun",
      attributionText: "from AHD",
      text: ["first", "second"],
      word: "test",
      id: "D1",
    },
    {
      partOfSpeech: "verb",
      attributionText: "from AHD",
      text: "A real definition.",
      word: "test",
      id: "D2",
    },
  ];
  setup_word_search_mocks(undefined, undefined, definitions_with_array_text);

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  expect(body.definitions.response).toHaveLength(1);
  expect(body.definitions.response[0].text).toBe("A real definition.");
});

test("returns empty response arrays when Wordnik returns no data", async () => {
  setup_word_search_mocks([], [], []);

  const res = await app.inject({
    method: "GET",
    url: make_url("nonexistentword"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  expect(body.etymologies.response).toStrictEqual([]);
  expect(body.pronunciations.response).toStrictEqual([]);
  expect(body.definitions.response).toStrictEqual([]);
  expect(body.etymologies.is_error).toBe(false);
  expect(body.pronunciations.is_error).toBe(false);
  expect(body.definitions.is_error).toBe(false);
});

test("handles Wordnik 404 gracefully with empty results", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  const not_found_error = new axios.AxiosError(
    "Not Found",
    "404",
    undefined,
    undefined,
    {
      status: 404,
      data: {},
      headers: mock_rate_limit_headers,
      statusText: "Not Found",
      config: {} as never,
    },
  );
  (not_found_error as { status: number }).status = 404;

  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response)
    .mockRejectedValueOnce(not_found_error)
    .mockRejectedValueOnce(not_found_error)
    .mockRejectedValueOnce(not_found_error) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_with_dictionary,
  );

  const res = await app.inject({
    method: "GET",
    url: make_url("xyznotaword"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  expect(body.etymologies.response).toStrictEqual([]);
  expect(body.pronunciations.response).toStrictEqual([]);
  expect(body.definitions.response).toStrictEqual([]);
  expect(body.etymologies.is_error).toBe(false);
});

test("handles Wordnik server error and sets is_error true", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  const server_error = new axios.AxiosError(
    "Internal Server Error",
    "500",
    undefined,
    undefined,
    {
      status: 500,
      data: {},
      headers: mock_rate_limit_headers,
      statusText: "Internal Server Error",
      config: {} as never,
    },
  );
  (server_error as { status: number }).status = 500;

  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response)
    .mockRejectedValueOnce(server_error)
    .mockResolvedValueOnce(make_wordnik_response(mock_pronunciations_response))
    .mockResolvedValueOnce(
      make_wordnik_response(mock_definitions_response),
    ) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(
    basic_facility_with_dictionary,
  );

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  expect(body.etymologies.is_error).toBe(true);
  expect(body.etymologies.response).toStrictEqual([]);
  expect(body.pronunciations.is_error).toBe(false);
  expect(body.definitions.is_error).toBe(false);
});

test("excludes etymologies with no etymologyXML", async () => {
  const etymologies_mixed = [
    {
      etymologyXML: "<ety>From Latin</ety>",
      sourceDictionary: "ahd-5",
      id: "E1",
    },
    {
      etymologyXML: "",
      sourceDictionary: "ahd-5",
      id: "E2",
    },
  ];
  setup_word_search_mocks(etymologies_mixed);

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(200);
  const body = res.json();
  expect(body.etymologies.response).toHaveLength(1);
});

test("returns 403 when facility does not have dictionary permissions", async () => {
  discover_mock.mockResolvedValueOnce(["mock", null]);
  axios.get = vi
    .fn()
    .mockReturnValueOnce(iac_credential_response)
    .mockReturnValueOnce(iac_account_response) as typeof axios.get;
  db_mock.get_first_facility.mockResolvedValueOnce(basic_facility);

  const res = await app.inject({
    method: "GET",
    url: make_url("test"),
    headers: { host: valid_student_subdomain },
  });

  expect(res.statusCode).toEqual(403);
});
