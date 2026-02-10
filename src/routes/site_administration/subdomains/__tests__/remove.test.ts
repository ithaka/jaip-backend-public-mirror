import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../tests/helpers.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import { get_route } from "../../../../utils/index.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../tests/fixtures/auth/fixtures.js";
import {
  basic_user_ungrouped_edit_subdomains,
  basic_user_ungrouped_remove_subdomains,
  delete_subdomain_body_invalid,
  delete_subdomain_body_valid,
} from "../../../../tests/fixtures/site_administration/subdomains/fixtures.js";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.delete_subdomain)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "DELETE",
    url: route,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: delete_subdomain_body_invalid,
    headers: {
      host: valid_admin_subdomain,
    },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no subdomain permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_edit_subdomains,
  );

  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: delete_subdomain_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and remove subdomain permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_remove_subdomains,
  );
  db_mock.remove_subdomain.mockResolvedValueOnce(null);

  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: delete_subdomain_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.remove_subdomain).toHaveBeenCalledTimes(1);
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(200);
});
