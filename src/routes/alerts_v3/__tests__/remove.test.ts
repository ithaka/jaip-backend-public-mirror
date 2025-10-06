import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers";
import { get_route } from "../../../utils/index";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { full_targeted_alert } from "../../../tests/fixtures/alerts/fixtures";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures";
import {
  basic_admin,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.delete_alert)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "DELETE",
    url: route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route invalid body id`, async () => {
  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: { ...full_targeted_alert, id: undefined },
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: { id: 1 },
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and edit facility permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockReturnValue(axios_session_data_with_email) as typeof axios.post;
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  const res = await app.inject({
    method: "DELETE",
    url: `${route}`,
    payload: { id: 1 },
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.remove_targeted_alert).toHaveBeenCalledTimes(1);
  expect(res.payload).toEqual("");
  expect(res.statusCode).toEqual(204);
});
