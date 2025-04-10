import { build_test_server, db_mock, discover_mock } from "../../tests/helpers";
import route_settings from "./routes";
import {
  axios_session_data_no_email_or_code,
  axios_session_data_with_code,
  axios_session_data_with_email,
  fake_subdomain,
  get_first_facility_resolved_value,
  get_ip_bypass_resolved_value,
  get_sitecode_by_subdomain_resolved_value,
  valid_provider_subdomain,
} from "../../tests/fixtures/auth/fixtures";
import axios from "axios";

const app = build_test_server([route_settings]);

afterEach(() => {
  jest.clearAllMocks();
});

test('requests the "/auth" route with no service discovery', async () => {
  discover_mock.mockResolvedValueOnce(["", new Error("error")]);
  const res = await app.inject({
    method: "GET",
    url: "/api/v2/auth",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/auth" route with no session data', async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(new Error("error"));

  const res = await app.inject({
    method: "GET",
    url: "/api/v2/auth",
  });
  expect(res.statusCode).toEqual(500);
});

test('requests the "/auth" route with ip bypass', async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_no_email_or_code);
  db_mock.get_first_facility.mockResolvedValueOnce(
    get_first_facility_resolved_value,
  );

  db_mock.get_ip_bypass.mockResolvedValueOnce(get_ip_bypass_resolved_value);

  const res = await app.inject({
    method: "GET",
    url: "/api/v2/auth",
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(db_mock.get_ip_bypass).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});

test('requests the "/auth" route with valid sitecode and invalid subdomain', async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_code);
  db_mock.get_sitecode_by_subdomain.mockResolvedValueOnce(null);
  db_mock.get_first_facility.mockResolvedValueOnce(
    get_first_facility_resolved_value,
  );

  const res = await app.inject({
    method: "GET",
    url: "/api/v2/auth",
    headers: {
      host: fake_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_sitecode_by_subdomain).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(0);
  expect(db_mock.get_ip_bypass).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(500);
  expect(res.payload).toContain("No sitecode found for nonstandard subdomain");
});

test('requests the "/auth" route with valid sitecode and valid subdomain', async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_code);
  db_mock.get_sitecode_by_subdomain.mockResolvedValueOnce(
    get_sitecode_by_subdomain_resolved_value,
  );

  const res = await app.inject({
    method: "GET",
    url: "/api/v2/auth",
    headers: {
      host: valid_provider_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_sitecode_by_subdomain).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(db_mock.get_ip_bypass).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(200);
});

test('requests the "/auth" route with valid sitecode and standard subdomain', async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_code);
  db_mock.get_first_facility.mockResolvedValueOnce(
    get_first_facility_resolved_value,
  );

  const res = await app.inject({
    method: "GET",
    url: "/api/v2/auth",
    headers: {
      host: "test-pep.jstor.org",
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(1);
  expect(db_mock.get_ip_bypass).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(200);
});

test('requests the "/auth" route with invalid email', async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(null);

  const res = await app.inject({
    method: "GET",
    url: "/api/v2/auth",
    headers: {
      host: fake_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(db_mock.get_sitecode_by_subdomain).toHaveBeenCalledTimes(1);
  expect(db_mock.get_first_facility).toHaveBeenCalledTimes(0);
  expect(db_mock.get_ip_bypass).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(500);
  console.log(res.payload);
});
