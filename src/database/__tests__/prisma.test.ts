import { expect, test, vi } from "vitest";
import { PrismaClient, status_options } from "../prisma/client.js";
import { PrismaJAIPDatabase } from "../prisma.js";
import { bulk_approval_query } from "../../routes/queries/bulk_approval.js";

const make_database = () => {
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRaw: vi.fn().mockResolvedValue([]),
    request_permissions: {
      upsert: vi.fn().mockResolvedValue({ id: 1 }),
    },
    statuses: {
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      createManyAndReturn: vi.fn().mockResolvedValue([]),
    },
    status_details: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const client = {
    $on: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
    statuses: tx.statuses,
  };

  return {
    client,
    db: new PrismaJAIPDatabase(client as unknown as PrismaClient),
    tx,
  };
};

const doi = "10.2307/request-status-test";
const group_id = 7;
const facility_a = 101;
const facility_b = 102;
const admin_id = 900;

const status_row = (entity_id: number, status: status_options, id: number) => ({
  id,
  jstor_item_id: doi,
  jstor_item_type: "doi",
  group_id,
  status,
  entity_id,
  entities: { id: entity_id, name: `Entity ${entity_id}` },
  groups: { id: group_id, name: "Group 7" },
  status_details: [],
});

test("bulk statuses load details only for the latest item/group IDs, including undo rows", async () => {
  const { client, db } = make_database();
  const query = bulk_approval_query("discipline", ["history"], [7, 8]);
  client.statuses.groupBy.mockResolvedValue([
    { jstor_item_id: "history", group_id: 7, _max: { id: 20 } },
    { jstor_item_id: "history", group_id: 8, _max: { id: 21 } },
  ]);
  const rows = [
    status_row(admin_id, status_options.Incomplete, 21),
    status_row(admin_id, status_options.Approved, 20),
  ];
  client.statuses.findMany.mockResolvedValue(rows);

  const [results, error] = await db.get_bulk_statuses(query);

  expect(error).toBeNull();
  expect(results).toEqual(rows);
  expect(client.statuses.groupBy).toHaveBeenCalledWith({
    by: ["jstor_item_id", "group_id"],
    where: query.where,
    _max: { id: true },
  });
  expect(client.statuses.findMany).toHaveBeenCalledWith({
    select: query.select,
    orderBy: query.orderBy,
    where: { ...query.where, id: { in: [20, 21] } },
  });
});

test("bulk statuses skip detail loading when there are no matching groups or items", async () => {
  const { client, db } = make_database();

  expect(
    await db.get_bulk_statuses(bulk_approval_query("headid", [], [])),
  ).toEqual([[], null]);
  expect(client.statuses.findMany).not.toHaveBeenCalled();
});

test("bulk statuses preserve timestamp-based queries used by search", async () => {
  const { client, db } = make_database();
  const query = {
    distinct: ["jstor_item_id", "group_id"] as ("jstor_item_id" | "group_id")[],
    orderBy: { created_at: "desc" as const },
  };

  expect(await db.get_bulk_statuses(query)).toEqual([[], null]);
  expect(client.statuses.groupBy).not.toHaveBeenCalled();
  expect(client.statuses.findMany).toHaveBeenCalledWith(query);
});

test("bulk statuses report aggregation errors without loading history", async () => {
  const { client, db } = make_database();
  const failure = new Error("database unavailable");
  client.statuses.groupBy.mockRejectedValueOnce(failure);

  expect(
    await db.get_bulk_statuses(
      bulk_approval_query("discipline", ["history"], [7]),
    ),
  ).toEqual([[], failure]);
  expect(client.statuses.findMany).not.toHaveBeenCalled();
});

test("suspending a facility updates its own Pending request despite another facility's newer Pending", async () => {
  const { db, tx } = make_database();

  await db.create_request_permission({
    data: {
      facility_id: facility_a,
      admin_id,
      start_date: new Date(Date.now() - 60_000),
      end_date: null,
    },
  });

  const statement = tx.$executeRaw.mock.calls[0][0];
  expect(statement.sql).toContain("UPDATE statuses s");
  expect(statement.sql).toContain("WHERE s.entity_id =");
  expect(statement.sql).toContain("admin.entity_type");
  expect(statement.sql).toContain("newer.status IN (");
  expect(statement.sql).not.toContain("newer.status = ?::status_options");
});

test("a facility cannot create Pending while another facility's latest status is Pending", async () => {
  const { db, tx } = make_database();
  tx.$queryRaw.mockResolvedValue([
    {
      id: 10,
      jstor_item_id: doi,
      jstor_item_type: "doi",
      group_id,
      entity_id: facility_a,
      status: status_options.Pending,
    },
  ]);
  const request = {
    jstor_item_id: doi,
    jstor_item_type: "doi" as const,
    group_id,
    entity_id: facility_b,
    status: status_options.Pending,
  };

  const error = await db.create_request_statuses([request]);

  expect(error).toBeNull();
  expect(tx.$executeRaw.mock.calls[0][0].join(" ")).toContain(
    "pg_advisory_xact_lock",
  );
  expect(tx.$queryRaw.mock.calls[0][0].join(" ")).toContain(
    "SELECT DISTINCT ON",
  );
  expect(tx.statuses.createManyAndReturn).not.toHaveBeenCalled();
});

test("approvals acquire the same status-key lock before inserting", async () => {
  const { db, tx } = make_database();

  const error = await db.create_approvals(doi, [group_id], admin_id);

  expect(error).toBeNull();
  expect(tx.$executeRaw.mock.calls[0][0].join(" ")).toContain(
    "pg_advisory_xact_lock",
  );
  expect(tx.$executeRaw.mock.calls[0].slice(1)).toEqual([
    JSON.stringify([doi, "doi", group_id]),
  ]);
  expect(tx.$queryRaw).not.toHaveBeenCalled();
  expect(tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
    tx.statuses.createMany.mock.invocationCallOrder[0],
  );
  expect(tx.statuses.createMany).toHaveBeenCalledWith({
    data: [
      {
        jstor_item_type: "doi",
        jstor_item_id: doi,
        status: status_options.Approved,
        entity_id: admin_id,
        group_id,
      },
    ],
  });
});

test("approvals do not insert statuses when acquiring the lock fails", async () => {
  const { db, tx } = make_database();
  const lock_error = new Error("lock acquisition failed");
  tx.$executeRaw.mockRejectedValueOnce(lock_error);

  const error = await db.create_approvals(doi, [group_id], admin_id);

  expect(error).toBe(lock_error);
  expect(tx.statuses.createMany).not.toHaveBeenCalled();
});

test("the same facility cannot create a duplicate Pending request", async () => {
  const { db, tx } = make_database();
  tx.$queryRaw.mockResolvedValue([
    {
      id: 10,
      jstor_item_id: doi,
      jstor_item_type: "doi",
      group_id,
      entity_id: facility_a,
      status: status_options.Pending,
    },
  ]);

  const error = await db.create_request_statuses([
    {
      jstor_item_id: doi,
      jstor_item_type: "doi",
      group_id,
      entity_id: facility_a,
      status: status_options.Pending,
    },
  ]);

  expect(error).toBeNull();
  expect(tx.statuses.createManyAndReturn).not.toHaveBeenCalled();
});

test("get_statuses returns the still-Pending facility row for a mixed Suspended group", async () => {
  const { client, db } = make_database();
  client.$queryRaw.mockResolvedValue([
    { jstor_item_id: doi, group_id, pending_facility_ids: [facility_b] },
  ]);
  client.statuses.findMany.mockResolvedValue([
    status_row(facility_a, status_options.Denied, 8),
    status_row(facility_b, status_options.Pending, 7),
  ]);

  const [results, error] = await db.get_statuses(
    {
      where: { jstor_item_id: { in: [doi] } },
      orderBy: { id: "desc" },
      select: {
        jstor_item_id: true,
        status: true,
        entities: { select: { id: true, name: true } },
        groups: { select: { id: true, name: true } },
      },
    },
    [doi],
  );

  expect(error).toBeNull();
  expect(results.map((status) => status.status)).toEqual([
    status_options.Pending,
    status_options.Denied,
  ]);
});

test("get_statuses hides all group history when no facility remains Pending", async () => {
  const { client, db } = make_database();
  client.$queryRaw.mockResolvedValue([
    { jstor_item_id: doi, group_id, pending_facility_ids: [] },
  ]);

  await db.get_statuses(
    {
      where: { jstor_item_id: { in: [doi] } },
      orderBy: { id: "desc" },
    },
    [doi],
  );

  const where = client.statuses.findMany.mock.calls[0][0].where;
  expect(where.AND[1]).toEqual({ status: { not: status_options.Suspended } });
  expect(where.AND[2]).toEqual({
    NOT: { OR: [{ jstor_item_id: doi, group_id }] },
  });
});

test("get_statuses keeps an admin decision when a later request is Suspended", async () => {
  const { client, db } = make_database();
  client.$queryRaw.mockResolvedValue([
    {
      jstor_item_id: doi,
      group_id,
      pending_facility_ids: [],
      has_admin_decision: true,
    },
  ]);
  client.statuses.findMany.mockResolvedValue([
    status_row(admin_id, status_options.Denied, 8),
  ]);

  const [results, error] = await db.get_statuses(
    {
      where: { jstor_item_id: { in: [doi] } },
      orderBy: { id: "desc" },
      distinct: ["jstor_item_id", "group_id"],
    },
    [doi],
  );

  const where = client.statuses.findMany.mock.calls[0][0].where;
  expect(error).toBeNull();
  expect(results[0].status).toBe(status_options.Denied);
  expect(where.AND[2]).toEqual({ NOT: { OR: [] } });
});

test("facility distinct status lookup selects only current Pending facilities in a mixed group", async () => {
  const { client, db } = make_database();
  client.$queryRaw.mockResolvedValue([
    { jstor_item_id: doi, group_id, pending_facility_ids: [facility_b] },
  ]);

  await db.get_statuses(
    {
      where: {
        jstor_item_id: { in: [doi] },
        group_id: { in: [group_id] },
      },
      distinct: ["jstor_item_id", "group_id"],
      orderBy: { id: "desc" },
    },
    [doi],
  );

  const where = client.statuses.findMany.mock.calls[0][0].where;
  expect(where.AND[3].OR).toContainEqual({
    jstor_item_id: doi,
    group_id,
    entity_id: facility_b,
    status: status_options.Pending,
  });
});

test("get_search_statuses promotes any current facility Pending over the latest Suspended row", async () => {
  const { client, db } = make_database();

  const [results, total, error] = await db.get_search_statuses(
    false,
    "",
    [group_id],
    [status_options.Pending],
    new Date("2026-01-01T00:00:00Z"),
    new Date("2026-01-31T23:59:59Z"),
    "new",
    25,
    1,
  );

  const sql = client.$queryRaw.mock.calls[0][0].sql as string;
  expect(sql).toContain("pending_overrides AS");
  expect(sql).toContain("current_pending_facilities AS");
  expect(sql).toContain("newer.id > facility.id");
  expect(sql).toContain("FROM pending_overrides");
  expect(sql).toContain("decision_overrides AS");
  expect(sql).toContain("FROM decision_overrides");
  expect(sql).toContain("FROM pending_counts");
  expect(error).toBeNull();
  expect(results).toEqual([]);
  expect(total).toBe(0);
});
