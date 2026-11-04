import { afterEach, expect, test, vi } from "vitest";
import {
  build_test_server,
  db_mock,
  discover_mock,
} from "../../../tests/helpers.js";
import { get_route } from "../../../utils/index.js";
import route_settings from "../routes.js";
import { route_schemas } from "../schemas.js";
import {
  bulk_statuses,
  item_statuses,
  processed_search_response_with_bulk_statuses,
  processed_search_response_with_mixed_statuses,
  processed_search_response_with_mixed_statuses_reviewer,
  search3_results,
  search_request_invalid,
  search_request_valid,
  tokens,
} from "../../../tests/fixtures/search/fixtures.js";
import {
  axios_session_data_with_email,
  valid_admin_subdomain,
} from "../../../tests/fixtures/auth/fixtures.js";
import {
  basic_facility,
  basic_facility_with_restricted_items_subscription,
  basic_reviewer,
} from "../../../tests/fixtures/users/fixtures.js";
import { processed_search_response } from "../../../tests/fixtures/search/fixtures.js";
import axios from "axios";
import { status_options } from "../../../database/prisma/client.js";
import { DBEntity } from "../../../types/database.js";
import { MediaRecord } from "../../../types/media_record.js";
import { STATUS_OPTIONS } from "../../../consts/index.js";

const app = build_test_server([route_settings]);
afterEach(() => {
  vi.resetAllMocks();
});

const search_route = `${route_settings.options.prefix}${get_route(route_schemas.search)}`;
test.each(
  [false, true].flatMap((is_admin) =>
    [false, true].flatMap((has_bulk_approval) =>
      [null, ...Object.values(status_options)].map((status) => ({
        is_admin,
        has_bulk_approval,
        status,
      })),
    ),
  ),
)(
  "applies global approval to $status with admin=$is_admin and bulk=$has_bulk_approval",
  async ({ is_admin, has_bulk_approval, status }) => {
    const user = structuredClone(
      is_admin ? basic_reviewer : basic_facility,
    ) as DBEntity;
    user.entities.groups_entities?.forEach(({ groups }) => {
      if (groups) groups.global_approvals = { is_approved: true };
    });
    if (is_admin) {
      user.entities.groups_entities?.push({
        role: "admin",
        groups: { id: 2, name: "Other group", global_approvals: null },
      });
    }
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi
      .fn()
      .mockResolvedValueOnce(axios_session_data_with_email)
      .mockResolvedValueOnce({ status: 200, data: search3_results });
    db_mock.get_first_user.mockResolvedValueOnce(user);
    db_mock.get_all_tokens.mockResolvedValueOnce([tokens, null]);
    db_mock.get_bulk_statuses.mockResolvedValueOnce([
      has_bulk_approval ? bulk_statuses : [],
      null,
    ]);
    db_mock.get_statuses.mockResolvedValueOnce([
      status ? [{ ...item_statuses[0], status }] : [],
      null,
    ]);
    db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

    const res = await app.inject({
      method: "POST",
      url: search_route,
      payload: search_request_valid,
      headers: is_admin ? { host: valid_admin_subdomain } : {},
    });

    expect(res.statusCode).toEqual(200);
    const doc = res.json().docs[0] as MediaRecord;
    expect(doc.mediaReviewStatuses?.["1"]).toMatchObject({
      status:
        status === status_options.Denied
          ? status_options.Denied
          : STATUS_OPTIONS.GloballyApproved,
      statusLabel:
        status === status_options.Denied
          ? status_options.Denied
          : STATUS_OPTIONS.GloballyApproved,
      groupID: 1,
    });
    if (status !== status_options.Denied) {
      expect(doc.mediaReviewStatuses?.["1"].statusCreatedAt).toBeNull();
    }
    expect(doc.history?.map((entry) => entry.status) || []).toEqual(
      is_admin && status && status !== status_options.Suspended ? [status] : [],
    );
    expect(doc.mediaReviewStatuses?.["2"]).toBeUndefined();
    if (is_admin) {
      expect(db_mock.get_first_user.mock.calls[0][0]).toMatchObject({
        select: {
          entities: {
            select: {
              groups_entities: {
                select: {
                  groups: {
                    select: {
                      global_approvals: { select: { is_approved: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }
  },
);

test.each(
  [1, 2].flatMap((selected_group) =>
    [null, status_options.Denied].map((status) => ({ selected_group, status })),
  ),
)(
  "respects group selection $selected_group with global approval and item status $status",
  async ({ selected_group, status }) => {
    const user = structuredClone(basic_reviewer) as DBEntity;
    user.entities.groups_entities?.forEach(({ groups }) => {
      if (groups) groups.global_approvals = null;
    });
    user.entities.groups_entities?.push({
      role: "admin",
      groups: {
        id: 2,
        name: "Globally approved group",
        global_approvals: { is_approved: true },
      },
    });
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi
      .fn()
      .mockResolvedValueOnce(axios_session_data_with_email)
      .mockResolvedValueOnce({ status: 200, data: search3_results });
    db_mock.get_first_user.mockResolvedValueOnce(user);
    db_mock.get_all_tokens.mockResolvedValueOnce([tokens, null]);
    db_mock.get_bulk_statuses.mockResolvedValueOnce([[], null]);
    db_mock.get_statuses.mockResolvedValueOnce([
      status
        ? [
            {
              ...item_statuses[0],
              status,
              groups: { id: 2, name: "Globally approved group" },
            },
          ]
        : [],
      null,
    ]);
    db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

    const res = await app.inject({
      method: "POST",
      url: search_route,
      payload: { ...search_request_valid, groups: [selected_group] },
      headers: { host: valid_admin_subdomain },
    });

    expect(res.statusCode).toEqual(200);
    const doc = res.json().docs[0] as MediaRecord;
    expect(doc.mediaReviewStatuses?.["1"]).toBeUndefined();
    if (selected_group === 2) {
      expect(doc.mediaReviewStatuses?.["2"]?.status).toBe(
        status ?? STATUS_OPTIONS.GloballyApproved,
      );
    } else {
      expect(doc.mediaReviewStatuses?.["2"]).toBeUndefined();
    }
  },
);

test.each([undefined, null, { is_approved: false }])(
  "does not globally approve items when global_approvals is %s",
  async (global_approvals) => {
    const user = structuredClone(basic_facility) as DBEntity;
    user.entities.groups_entities?.forEach(({ groups }) => {
      if (groups) groups.global_approvals = global_approvals;
    });
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi
      .fn()
      .mockResolvedValueOnce(axios_session_data_with_email)
      .mockResolvedValueOnce({ status: 200, data: search3_results });
    db_mock.get_first_user.mockResolvedValueOnce(user);
    db_mock.get_bulk_statuses.mockResolvedValueOnce([[], null]);
    db_mock.get_statuses.mockResolvedValueOnce([[], null]);
    db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

    const res = await app.inject({
      method: "POST",
      url: search_route,
      payload: search_request_valid,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.json().docs).toEqual(processed_search_response);
  },
);

test.each([status_options.Pending, status_options.Denied])(
  "keeps restrictions above global approval and %s",
  async (status) => {
    const user = structuredClone(
      basic_facility_with_restricted_items_subscription,
    ) as DBEntity;
    user.entities.groups_entities?.forEach(({ groups }) => {
      if (groups) groups.global_approvals = { is_approved: true };
    });
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi
      .fn()
      .mockResolvedValueOnce(axios_session_data_with_email)
      .mockResolvedValueOnce({ status: 200, data: search3_results });
    db_mock.get_first_user.mockResolvedValueOnce(user);
    db_mock.get_bulk_statuses.mockResolvedValueOnce([bulk_statuses, null]);
    db_mock.get_statuses.mockResolvedValueOnce([
      [{ ...item_statuses[0], status }],
      null,
    ]);
    db_mock.get_restricted_items.mockResolvedValueOnce([
      [
        {
          id: 1,
          entity_id: 3,
          jstor_item_id: item_statuses[0].jstor_item_id!,
          reason: "Restricted item",
          is_restricted: true,
          created_at: new Date("2026-10-01T00:00:00Z"),
          updated_at: new Date("2026-10-01T00:00:00Z"),
        },
      ],
      null,
    ]);

    const res = await app.inject({
      method: "POST",
      url: search_route,
      payload: search_request_valid,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.json().docs[0]).toMatchObject({
      is_restricted: true,
      mediaReviewStatuses: {
        "1": {
          status: "Restricted",
          statusDetails: { reason: "Restricted item" },
        },
      },
    });
  },
);

test(`requests the ${search_route} route with no body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: search_route,
  });
  expect(res.statusCode).toEqual(400);
});

test(`requests the ${search_route} route with invalid body`, async () => {
  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_invalid,
  });
  expect(res.statusCode).toEqual(400);
});

test(`rewrites same-origin pdf urls to iid queries`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: {
        total: 0,
        results: [] as [],
      },
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);

  const pdf_url =
    "http://pep.jstor.org/pdf/a37ddab2-abda-340b-ab09-44a6906984a7";
  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: {
      ...search_request_valid,
      query: pdf_url,
    },
    headers: {
      origin: "http://pep.jstor.org",
    },
  });

  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(axios.post).toHaveBeenNthCalledWith(
    2,
    expect.any(String),
    expect.objectContaining({
      query: "",
      filter_queries: expect.arrayContaining([
        "id:a37ddab2-abda-340b-ab09-44a6906984a7",
      ]),
    }),
    expect.any(Object),
  );
  expect(res.json()).toEqual({ docs: [], total: 0 });
  expect(res.statusCode).toEqual(200);
});
test(`requests the ${search_route} route with a facility and valid body and no statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([[], null]);
  db_mock.get_statuses.mockResolvedValueOnce([[], null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(0);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
});
test(`requests the ${search_route} route with a facility and valid body and bulk statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([bulk_statuses, null]);
  db_mock.get_statuses.mockResolvedValueOnce([[], null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(0);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response_with_bulk_statuses,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
});
// A Denied item decision continues to override a bulk approval. Pending is not a
// review decision, so a bulk approval remains effective while a request is pending.
test(`requests the ${search_route} route with a facility and valid body and both bulk and item status`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([bulk_statuses, null]);
  db_mock.get_statuses.mockResolvedValueOnce([item_statuses, null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(0);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response_with_mixed_statuses,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
});

test.each([
  {
    status: status_options.Pending,
    doi: "10.2307/resrep62411",
    document_index: 0,
    approval_type: "discipline",
  },
  {
    status: status_options.Suspended,
    doi: "10.2307/resrep62411",
    document_index: 0,
    approval_type: "discipline",
  },
  {
    status: status_options.Pending,
    doi: "10.2307/resrep62436",
    document_index: 1,
    approval_type: "discipline",
  },
  {
    status: status_options.Suspended,
    doi: "10.2307/resrep62436",
    document_index: 1,
    approval_type: "discipline",
  },
])(
  `keeps a $approval_type bulk approval when the item status is $status`,
  async ({ status, doi, document_index }) => {
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi
      .fn()
      .mockResolvedValueOnce(axios_session_data_with_email)
      .mockResolvedValueOnce({
        status: 200,
        data: search3_results,
      });
    db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
    db_mock.get_bulk_statuses.mockResolvedValueOnce([bulk_statuses, null]);
    db_mock.get_statuses.mockResolvedValueOnce([
      [
        {
          jstor_item_id: doi,
          jstor_item_type: "doi",
          status,
          created_at: new Date("2026-09-30T12:00:00Z"),
          entities: { id: 3, name: "Test Reviewer" },
          groups: { id: 1, name: "Ithaka" },
          status_details: [],
        },
      ],
      null,
    ]);
    db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

    const res = await app.inject({
      method: "POST",
      url: search_route,
      payload: search_request_valid,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.json().docs[document_index].mediaReviewStatuses).toEqual(
      processed_search_response_with_bulk_statuses[document_index]
        .mediaReviewStatuses,
    );
  },
);

test.each([status_options.Pending, status_options.Suspended])(
  `keeps a journal bulk approval when the item status is %s`,
  async (status) => {
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi
      .fn()
      .mockResolvedValueOnce(axios_session_data_with_email)
      .mockResolvedValueOnce({
        status: 200,
        data: search3_results,
      });
    db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
    db_mock.get_bulk_statuses.mockResolvedValueOnce([bulk_statuses, null]);
    db_mock.get_statuses.mockResolvedValueOnce([
      [
        {
          jstor_item_id: "10.2307/resrep62406",
          jstor_item_type: "doi",
          status,
          created_at: new Date("2026-09-30T12:00:00Z"),
          entities: { id: 3, name: "Test Reviewer" },
          groups: { id: 1, name: "Ithaka" },
          status_details: [],
        },
      ],
      null,
    ]);
    db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

    const res = await app.inject({
      method: "POST",
      url: search_route,
      payload: search_request_valid,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.json().docs[2].mediaReviewStatuses).toEqual(
      processed_search_response_with_bulk_statuses[2].mediaReviewStatuses,
    );
  },
);

test(`keeps the bulk approval instead of falling back to older item history when the latest item status is Pending`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([bulk_statuses, null]);
  db_mock.get_statuses.mockResolvedValueOnce([
    [
      {
        jstor_item_id: "10.2307/resrep62411",
        jstor_item_type: "doi",
        status: status_options.Pending,
        created_at: new Date("2026-09-30T12:00:00Z"),
        entities: { id: 3, name: "Test Reviewer" },
        groups: { id: 1, name: "Ithaka" },
        status_details: [],
      },
      {
        ...item_statuses[0],
        status: status_options.Denied,
        created_at: new Date("2026-09-29T12:00:00Z"),
      },
    ],
    null,
  ]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: search_route,
    payload: search_request_valid,
  });

  expect(res.statusCode).toEqual(200);
  expect(res.json().docs[0].mediaReviewStatuses).toEqual(
    processed_search_response_with_bulk_statuses[0].mediaReviewStatuses,
  );
});

test.each([status_options.Pending, status_options.Suspended])(
  `handles %s correctly when no bulk approval exists`,
  async (status) => {
    discover_mock.mockResolvedValue(["this text doesn't matter", null]);
    axios.post = vi
      .fn()
      .mockResolvedValueOnce(axios_session_data_with_email)
      .mockResolvedValueOnce({
        status: 200,
        data: search3_results,
      });
    db_mock.get_first_user.mockResolvedValueOnce(basic_facility);
    db_mock.get_bulk_statuses.mockResolvedValueOnce([[], null]);
    db_mock.get_statuses.mockResolvedValueOnce([
      [
        {
          jstor_item_id: "10.2307/resrep62411",
          jstor_item_type: "doi",
          status,
          created_at: new Date("2026-09-30T12:00:00Z"),
          entities: { id: 3, name: "Test Reviewer" },
          groups: { id: 1, name: "Ithaka" },
          status_details: [],
        },
      ],
      null,
    ]);
    db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

    const res = await app.inject({
      method: "POST",
      url: search_route,
      payload: search_request_valid,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.json().docs[0].mediaReviewStatuses?.["1"]?.status).toBe(
      status === status_options.Suspended ? undefined : status_options.Pending,
    );
  },
);

test(`requests the ${search_route} route with a reviewer and valid body and both bulk and item statuses`, async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([bulk_statuses, null]);
  db_mock.get_statuses.mockResolvedValueOnce([item_statuses, null]);
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: `${search_route}`,
    payload: search_request_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(discover_mock).toHaveBeenCalledTimes(2);
  expect(db_mock.get_all_tokens).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(res.json()).toEqual({
    docs: processed_search_response_with_mixed_statuses_reviewer,
    total: search3_results.total,
  });
  expect(res.statusCode).toEqual(200);
});

test("returns reviewer history globally newest-first across groups", async () => {
  discover_mock.mockResolvedValue(["this text doesn't matter", null]);
  axios.post = vi
    .fn()
    .mockResolvedValueOnce(axios_session_data_with_email)
    .mockResolvedValueOnce({
      status: 200,
      data: search3_results,
    });
  db_mock.get_first_user.mockResolvedValueOnce(basic_reviewer);
  db_mock.get_bulk_statuses.mockResolvedValueOnce([[], null]);
  db_mock.get_statuses.mockResolvedValueOnce([
    [
      {
        ...item_statuses[0],
        created_at: new Date("2026-09-29T12:00:00Z"),
      },
      {
        ...item_statuses[0],
        created_at: new Date("2026-09-30T12:00:00Z"),
        groups: { id: 2, name: "Other group" },
      },
    ],
    null,
  ]);
  db_mock.get_all_tokens.mockResolvedValueOnce([tokens, null]);
  db_mock.get_restricted_items.mockResolvedValueOnce([[], null]);

  const res = await app.inject({
    method: "POST",
    url: search_route,
    payload: search_request_valid,
    headers: {
      host: valid_admin_subdomain,
    },
  });

  expect(
    res
      .json()
      .docs[0].history.map(
        (status: { statusCreatedAt: string }) => status.statusCreatedAt,
      ),
  ).toEqual(["2026-09-30T12:00:00.000Z", "2026-09-29T12:00:00.000Z"]);
});
