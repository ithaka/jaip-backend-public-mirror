import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import { get_route } from "../../../utils/index.js";
import {
  submit_global_approval_invalid,
  submit_global_approval_valid,
} from "../../../tests/fixtures/media_review/requests/fixtures.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_reviewer,
  basic_user_ungrouped,
} from "../../../tests/fixtures/users/fixtures.js";

const app = build_test_server([route_settings]);
const create_route = `${route_settings.options.prefix}${get_route(route_schemas.create_global_approvals)}`;
const remove_route = `${route_settings.options.prefix}${get_route(route_schemas.remove_global_approvals)}`;

afterEach(() => {
  vi.resetAllMocks();
});

test(`requests the ${create_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: create_route,
    headers: { host: valid_admin_subdomain },
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${create_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: create_route,
    payload: submit_global_approval_invalid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${create_route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: create_route,
    payload: submit_global_approval_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
  expect(db_mock.create_global_approval).not.toHaveBeenCalled();
});

test(`rejects creating a global approval for a group where the reviewer does not have bulk approval permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: create_route,
    payload: { group_ids: [1, 2] },
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
  expect(db_mock.create_global_approval).not.toHaveBeenCalled();
});

test(`requests the ${create_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  const reviewer = structuredClone(basic_reviewer);
  reviewer.entities.groups_entities.push({
    groups: { id: 2, name: "Ilium" },
    role: "user",
  });
  reviewer.entities.features_groups_entities.push(
    ...reviewer.entities.features_groups_entities.map((feature) => ({
      ...feature,
      groups: { id: 2 },
    })),
  );
  db_mock.get_first_user.mockResolvedValueOnce(reviewer);
  db_mock.create_global_approval.mockResolvedValueOnce([
    [{ id: 10 }, { id: 11 }],
    null,
  ]);

  const res = await app.inject({
    method: "POST",
    url: create_route,
    payload: { group_ids: [1, 2] },
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.create_global_approval).toHaveBeenCalledTimes(1);
  expect(db_mock.create_global_approval).toHaveBeenCalledWith(
    reviewer.entities.id,
    [1, 2],
  );
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});

test(`returns an error when ${create_route} fails`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.create_global_approval.mockResolvedValueOnce([
    [],
    new Error("database failure"),
  ]);

  const res = await app.inject({
    method: "POST",
    url: create_route,
    payload: submit_global_approval_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(500);
  expect(res.payload).toContain("database failure");
});

test(`requests the ${remove_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: remove_route,
    headers: { host: valid_admin_subdomain },
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${remove_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: remove_route,
    payload: submit_global_approval_invalid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(400);
});

test(`requests the ${remove_route} route with valid body and no permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_user_ungrouped);
  db_mock.manage_entity.mockClear();

  const res = await app.inject({
    method: "POST",
    url: remove_route,
    payload: submit_global_approval_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
  expect(db_mock.remove_global_approval).not.toHaveBeenCalled();
});

test(`rejects removing a global approval for a group where the reviewer does not have bulk undo permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);

  const res = await app.inject({
    method: "POST",
    url: remove_route,
    payload: { group_ids: [1, 2] },
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(403);
  expect(db_mock.remove_global_approval).not.toHaveBeenCalled();
});

test(`requests the ${remove_route} route with valid body and request permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  const reviewer = structuredClone(basic_reviewer);
  reviewer.entities.groups_entities.push({
    groups: { id: 2, name: "Ilium" },
    role: "user",
  });
  reviewer.entities.features_groups_entities.push(
    ...reviewer.entities.features_groups_entities.map((feature) => ({
      ...feature,
      groups: { id: 2 },
    })),
  );
  db_mock.get_first_user.mockResolvedValueOnce(reviewer);
  db_mock.remove_global_approval.mockResolvedValueOnce(null);

  const res = await app.inject({
    method: "POST",
    url: remove_route,
    payload: { group_ids: [1, 2] },
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.remove_global_approval).toHaveBeenCalledTimes(1);
  expect(db_mock.remove_global_approval).toHaveBeenCalledWith(
    reviewer.entities.id,
    [1, 2],
  );
  expect(res.payload).toStrictEqual("");
  expect(res.statusCode).toEqual(201);
});

test(`returns an error when ${remove_route} fails`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.remove_global_approval.mockResolvedValueOnce(
    new Error("database failure"),
  );

  const res = await app.inject({
    method: "POST",
    url: remove_route,
    payload: submit_global_approval_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.statusCode).toEqual(500);
  expect(res.payload).toContain("database failure");
});
