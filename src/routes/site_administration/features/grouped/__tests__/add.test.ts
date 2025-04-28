import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../../../tests/helpers";
import route_settings from "../routes";
import { route_schemas } from "../schemas";
import { get_route } from "../../../../../utils";
import axios from "axios";
import { basic_admin } from "../../../../../tests/fixtures/users/fixtures";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../../../tests/fixtures/auth/fixtures";
import {
  add_grouped_feature_body_invalid,
  add_grouped_feature_body_valid,
  basic_user_ungrouped_add_grouped_feature,
  grouped_feature_response,
} from "../../../../../tests/fixtures/site_administration/features/grouped/fixtures";
import { features, Prisma } from "@prisma/client";

const app = build_test_server([route_settings]);
const prefix = route_settings.options.prefix;
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const route = `${prefix}${get_route(route_schemas.add_group_feature)}`;
test(`requests the ${route} route`, async () => {
  const res = await app.inject({
    method: "POST",
    url: route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: add_grouped_feature_body_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${route} route with valid body and no grouped feature permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_admin);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: add_grouped_feature_body_valid,
  });

  expect(res.statusCode).toEqual(403);
});

test(`requests the ${route} route with valid body and add grouped feature permissions`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_add_grouped_feature,
  );
  db_mock.create_grouped_feature.mockResolvedValueOnce([
    {
      ...grouped_feature_response[0],
      created_at: new Date(),
      updated_at: new Date(),
    },
    null,
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: add_grouped_feature_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.create_grouped_feature).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual(grouped_feature_response[0]);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${route} route with valid body, add grouped feature permissions, but a duplicate name`, async () => {
  discover_mock.mockResolvedValueOnce(["this text doesn't matter", null]);
  axios.post = jest.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(
    basic_user_ungrouped_add_grouped_feature,
  );
  db_mock.create_grouped_feature.mockResolvedValueOnce([
    {} as features,
    new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`name`)",
      {
        clientVersion: "prisma-client-js",
        code: "P2002",
      },
    ),
  ]);

  const res = await app.inject({
    method: "POST",
    url: `${route}`,
    payload: add_grouped_feature_body_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(db_mock.get_first_user).toHaveBeenCalledTimes(1);
  expect(db_mock.create_grouped_feature).toHaveBeenCalledTimes(1);
  expect(res.json()).toStrictEqual({
    duplicate: true,
  });
  expect(res.statusCode).toEqual(200);
});
