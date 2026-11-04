import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import route_settings from "../routes.js";
import {
  ale_response,
  approved_discipline_response,
  approved_item_response,
  approved_journal_response,
  approved_pseudo_discipline_response,
  cedar_item_view_response,
  cedar_item_view_unlisted_pseudo_response,
  denied_item_response,
  iid_path,
  metadata_response_allowed,
  metadata_response_allowed_pseudo,
  metadata_response_forbidden,
} from "../../../tests/fixtures/pages/fixtures.js";
import axios from "axios";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
  valid_student_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_facility,
  basic_facility_with_restricted_items_subscription,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures.js";
import { METADATA_ROUTE_PREFIX } from "../../../consts/index.js";
import { status_options } from "../../../database/prisma/client.js";
import { DBEntity } from "../../../types/database.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.resetAllMocks();
});

const metadata_route = `${route_settings.options.prefix}${METADATA_ROUTE_PREFIX}${iid_path}`;
test.each(
  [false, true].flatMap((is_restricted) =>
    [null, ...Object.values(status_options)].map((status) => ({
      is_restricted,
      status,
    })),
  ),
)(
  "checks metadata global approval with status=$status and restricted=$is_restricted",
  async ({ is_restricted, status }) => {
    const doi = cedar_item_view_response.find((item) => item.doi)?.doi;
    const user = structuredClone(
      basic_facility_with_restricted_items_subscription,
    ) as DBEntity;
    user.entities.groups_entities?.forEach(({ groups }) => {
      if (groups) groups.global_approvals = { is_approved: true };
    });
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
    db_mock.get_first_user.mockResolvedValueOnce(user);
    axios.get = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, data: cedar_item_view_response })
      .mockResolvedValue({ status: 200, data: ale_response });
    db_mock.get_restricted_items.mockResolvedValueOnce([
      is_restricted
        ? [
            {
              id: 1,
              entity_id: 3,
              jstor_item_id: doi!,
              reason: "Restricted item",
              is_restricted: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ]
        : [],
      null,
    ]);
    db_mock.get_item_status.mockResolvedValueOnce([
      status ? { ...approved_item_response, jstor_item_id: doi, status } : null,
      null,
    ]);

    const res = await app.inject({
      method: "GET",
      url: metadata_route,
      headers: { host: valid_student_subdomain },
    });

    const is_forbidden = is_restricted || status === status_options.Denied;
    expect(res.statusCode).toEqual(is_forbidden ? 403 : 200);
    expect(res.json()).toStrictEqual(
      is_forbidden ? metadata_response_forbidden : metadata_response_allowed,
    );
    expect(db_mock.get_restricted_items).toHaveBeenCalledExactlyOnceWith({
      where: {
        jstor_item_id: doi,
        is_restricted: true,
      },
    });
    expect(db_mock.get_item_status).toHaveBeenCalledTimes(
      is_restricted ? 0 : 1,
    );
    expect(db_mock.get_bulk_statuses).not.toHaveBeenCalled();
  },
);

test.each(["get_restricted_items", "get_item_status"] as const)(
  "does not grant global approval access when %s fails",
  async (lookup) => {
    const user = structuredClone(
      basic_facility_with_restricted_items_subscription,
    ) as DBEntity;
    user.entities.groups_entities?.forEach(({ groups }) => {
      if (groups) groups.global_approvals = { is_approved: true };
    });
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
    db_mock.get_first_user.mockResolvedValueOnce(user);
    axios.get = vi.fn().mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    });
    const error = new Error("Authorization lookup failed");
    db_mock.get_restricted_items.mockResolvedValueOnce([
      [],
      lookup === "get_restricted_items" ? error : null,
    ]);
    db_mock.get_item_status.mockResolvedValueOnce([
      null,
      lookup === "get_item_status" ? error : null,
    ]);

    const res = await app.inject({
      method: "GET",
      url: metadata_route,
      headers: { host: valid_student_subdomain },
    });

    expect(res.statusCode).toEqual(500);
    expect(db_mock.get_item_status).toHaveBeenCalledTimes(
      lookup === "get_item_status" ? 1 : 0,
    );
    expect(db_mock.get_bulk_statuses).not.toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledTimes(1);
  },
);

test(`requests the ${metadata_route}" route without a user or facility`, async () => {
  const res = await app.inject({
    method: "GET",
    url: metadata_route,
  });
  expect(res.statusCode).toEqual(500);
});

test(`requests the ${metadata_route} route with a facility and no status`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi.fn().mockResolvedValueOnce({
    status: 200,
    data: cedar_item_view_response,
  });
  db_mock.get_item_status.mockResolvedValue([null, null]);
  db_mock.get_bulk_statuses.mockResolvedValue([[], null]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_forbidden);
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(db_mock.get_bulk_statuses).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${metadata_route} route with a facility and item approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });
  db_mock.get_item_status.mockResolvedValueOnce([approved_item_response, null]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${metadata_route} route with a facility and discipline approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });
  db_mock.get_item_status.mockResolvedValueOnce([null, null]);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([
    [approved_discipline_response],
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(db_mock.get_bulk_statuses).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${metadata_route} route with a facility and unlisted pseudo discipline approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_unlisted_pseudo_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });
  db_mock.get_item_status.mockResolvedValueOnce([null, null]);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([
    [approved_pseudo_discipline_response],
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed_pseudo);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(db_mock.get_bulk_statuses).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${metadata_route} route with a facility and journal approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });
  db_mock.get_item_status.mockResolvedValueOnce([null, null]);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([
    [approved_journal_response],
    null,
  ]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(db_mock.get_bulk_statuses).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(200);
});

test(`requests the ${metadata_route} route with a facility and denied status`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  axios.get = vi.fn().mockResolvedValueOnce({
    status: 200,
    data: cedar_item_view_response,
  });

  db_mock.get_item_status.mockResolvedValueOnce([denied_item_response, null]);

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_student_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_forbidden);
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toEqual(403);
});

test(`requests the ${metadata_route} route with an admin and item approval`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi.fn().mockResolvedValue(axios_session_data_with_email);
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  axios.get = vi
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      data: cedar_item_view_response,
    })
    .mockResolvedValue({
      status: 200,
      data: ale_response,
    });

  const res = await app.inject({
    method: "GET",
    url: metadata_route,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(res.json()).toStrictEqual(metadata_response_allowed);
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(db_mock.get_item_status).toHaveBeenCalledTimes(0);
  expect(res.statusCode).toEqual(200);
});
