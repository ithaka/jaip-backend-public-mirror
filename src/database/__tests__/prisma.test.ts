import { expect, test, vi } from "vitest";
import { PrismaClient, status_options } from "../prisma/client.js";
import { PrismaJAIPDatabase } from "../prisma.js";

const make_database = () => {
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRaw: vi.fn().mockResolvedValue([]),
    request_permissions: {
      upsert: vi.fn().mockResolvedValue({ id: 1 }),
    },
    statuses: {
      findMany: vi.fn().mockResolvedValue([]),
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
  expect(tx.$queryRaw.mock.calls[0][0].join(" ")).toContain(
    "pg_advisory_xact_lock",
  );
  expect(tx.$queryRaw.mock.calls[1][0].join(" ")).toContain(
    "SELECT DISTINCT ON",
  );
  expect(tx.statuses.createManyAndReturn).not.toHaveBeenCalled();
});

test("approvals acquire the same status-key lock before inserting", async () => {
  const { db, tx } = make_database();

  const error = await db.create_approvals(doi, [group_id], admin_id);

  expect(error).toBeNull();
  expect(tx.$queryRaw.mock.calls[0][0].join(" ")).toContain(
    "pg_advisory_xact_lock",
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
