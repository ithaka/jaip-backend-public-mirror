import {
  entity_types,
  jstor_types,
  Prisma,
  PrismaClient,
  status_options,
  subdomains,
} from "@prisma/client";
import { JAIPDatabase } from ".";
import { DBEntity, IPBypassResult, Status } from "../types/database";
import { User } from "../types/entities";
import { ensure_error } from "../utils";

export class PrismaJAIPDatabase implements JAIPDatabase {
  client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async get_first_feature() {
    return await this.client.features.findFirst();
  }

  async get_ip_bypass(
    query: Prisma.ip_bypassFindFirstArgs,
  ): Promise<IPBypassResult | null> {
    return (await this.client.ip_bypass.findFirst(
      query,
    )) as IPBypassResult | null;
  }
  async get_first_facility(
    query: Prisma.facilitiesFindFirstArgs,
  ): Promise<DBEntity | null> {
    return (await this.client.facilities.findFirst(query)) as DBEntity | null;
  }
  async get_first_user(
    query: Prisma.usersFindFirstArgs,
  ): Promise<DBEntity | null> {
    return (await this.client.users.findFirst(query)) as DBEntity | null;
  }
  async get_sitecode_by_subdomain(
    query: Prisma.subdomains_facilitiesFindFirstArgs,
  ): Promise<IPBypassResult | null> {
    return (await this.client.subdomains_facilities.findFirst(
      query,
    )) as IPBypassResult | null;
  }
  async get_valid_subdomain(
    query: Prisma.subdomainsFindFirstArgs,
  ): Promise<[{ subdomain: string } | null, Error | null]> {
    try {
      const subdomain = await this.client.subdomains.findFirst(query);
      return [subdomain, null];
    } catch (err) {
      const error = ensure_error(err);
      return [null, error];
    }
  }

  async get_users_and_count(
    count_query: Prisma.usersCountArgs,
    query: Prisma.usersFindManyArgs,
  ): Promise<[number, DBEntity[]]> {
    const [count, users] = await this.client.$transaction(async (tx) => {
      const count = await tx.users.count(count_query);
      const users = (await tx.users.findMany(query)) || [];
      return [count, users];
    });
    return [count, users as unknown as DBEntity[]];
  }
  async get_facilities_and_count(
    count_query: Prisma.facilitiesCountArgs,
    query: Prisma.facilitiesFindManyArgs,
  ): Promise<[number, DBEntity[]]> {
    const [count, facilities] = await this.client.$transaction(async (tx) => {
      const count = await tx.facilities.count(count_query);
      const facilities = (await tx.facilities.findMany(query)) || [];
      return [count, facilities];
    });
    return [count, facilities as unknown as DBEntity[]];
  }

  async remove_user(query: Prisma.usersUpdateArgs) {
    await this.client.users.update(query);
  }
  async remove_facility(query: Prisma.facilitiesUpdateArgs) {
    await this.client.facilities.update(query);
  }

  async get_user_id(
    query: Prisma.usersFindUniqueArgs,
  ): Promise<{ id: number } | null> {
    return await this.client.users.findUnique(query);
  }

  async get_facility_id(
    query: Prisma.facilitiesFindUniqueArgs,
  ): Promise<{ id: number } | null> {
    return await this.client.facilities.findUnique(query);
  }

  async manage_entity(
    action: "add" | "edit",
    type: entity_types,
    entity: User,
    is_manager: boolean,
  ) {
    await this.client
      .$queryRaw`CALL ${action}_${type}(${entity}::json,${is_manager})`;
  }

  async get_alerts(query: Prisma.alertsFindFirstArgs) {
    return await this.client.alerts.findFirst(query);
  }

  async get_statuses(
    query: Prisma.statusesFindManyArgs,
  ): Promise<[Status[], Error | null]> {
    try {
      const statuses = (await this.client.statuses.findMany(
        query,
      )) as unknown as Status[];
      return [statuses, null];
    } catch (err) {
      const error = ensure_error(err);
      return [[], error];
    }
  }

  // NOTE: Prisma is limited in its ability to handle bulk inserts. The createMany methods
  // don't allow simultaneously creating related records. This means that we can't create
  // a status and a status_detail in the same function call. We'll have to use a transaction
  // to ensure that all records are created or none are.
  async create_statuses(
    data: Prisma.statusesCreateManyInput[],
    comments: string = "",
    reason: string = "",
  ) {
    try {
      await this.client.$transaction(async (tx) => {
        const statuses = await tx.statuses.createManyAndReturn({
          data,
        });
        if (statuses.length) {
          if (comments !== "") {
            await tx.status_details.createMany({
              data: statuses.map((status) => {
                return {
                  status_id: status.id,
                  detail: comments,
                  type: "comments",
                };
              }),
            });
          }
          if (reason !== "") {
            await tx.status_details.createMany({
              data: statuses.map((status) => {
                return {
                  status_id: status.id,
                  detail: reason,
                  type: "reason",
                };
              }),
            });
          }
        } else {
          throw new Error("Failed to create statuses");
        }
      });
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
    return null;
  }

  async create_bulk_statuses(
    data: Prisma.statusesCreateManyInput[],
  ): Promise<Error | null> {
    try {
      await this.client.statuses.createMany({
        data,
      });
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
    return null;
  }
  async remove_bulk_approval(
    code: string,
    groups: number[],
    user_id: number,
  ): Promise<[Prisma.statusesCreateManyInput[] | null, Error | null]> {
    try {
      const db_inserts: Prisma.statusesCreateManyInput[] = [];
      await this.client.$transaction(async (tx) => {
        // It would be possible to do this in a single query by passing the existing item type in the
        // request. This approach places minimal trust in the request
        const existing_statuses = await tx.statuses.findMany({
          where: {
            jstor_item_id: code,
            group_id: {
              in: groups,
            },
          },
          select: {
            jstor_item_id: true,
            group_id: true,
            jstor_item_type: true,
            status: true,
          },
        });
        if (!existing_statuses.length) {
          throw new Error(
            "undo error: no existing statuses found for provided code in the provided groups",
          );
        }
        existing_statuses.forEach((status) => {
          db_inserts.push({
            jstor_item_type: status.jstor_item_type,
            jstor_item_id: code,
            status: status_options.Approved,
            entity_id: user_id,
            group_id: status.group_id,
          });
        });
        await tx.statuses.createMany({
          data: db_inserts,
        });
      });
      return [db_inserts, null];
    } catch (err) {
      const error = ensure_error(err);
      return [null, error];
    }
  }
  async create_approvals(
    doi: string,
    groups: number[],
    user_id: number,
  ): Promise<Error | null> {
    try {
      await this.client.statuses.createMany({
        data: groups.map((group_id) => {
          return {
            jstor_item_type: jstor_types.doi,
            jstor_item_id: doi,
            status: status_options.Approved,
            entity_id: user_id,
            group_id: group_id,
          };
        }),
      });
      return null;
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
  }
  async get_item_status(
    query: Prisma.statusesFindFirstArgs,
  ): Promise<[Status | null, Error | null]> {
    try {
      const status = await this.client.statuses.findFirst(query);
      if (!status) {
        throw new Error("No status found");
      }
      return [status as unknown as Status, null];
    } catch (err) {
      const error = ensure_error(err);
      return [null, error];
    }
  }
  async get_search_statuses(
    query: Prisma.statusesFindManyArgs,
  ): Promise<[Status[] | null, number | null, Error | null]> {
    try {
      const [statuses, count] = await this.client.$transaction(async (tx) => {
        const count = await tx.statuses.count({
          where: query.where,
        });
        const statuses = (await tx.statuses.findMany(query)) || [];
        return [statuses, count];
      });
      return [statuses as unknown as Status[], count, null];
    } catch (err) {
      const error = ensure_error(err);
      return [null, null, error];
    }
  }
  async get_all_tokens(): Promise<[string[], Error | null]> {
    try {
      const tokens = await this.client.tokens.findMany({
        select: {
          token: true,
        },
      });
      return [tokens.map((token) => token.token), null];
    } catch (err) {
      const error = ensure_error(err);
      return [[], error];
    }
  }

  async get_subdomains_and_count(
    count_query: Prisma.subdomainsCountArgs,
    query: Prisma.subdomainsFindManyArgs,
  ): Promise<[subdomains[], number, Error | null]> {
    try {
      const [count, subdomains] = await this.client.$transaction(async (tx) => {
        const count = await tx.subdomains.count(count_query);
        const subdomains = (await tx.subdomains.findMany(query)) || [];
        return [count, subdomains];
      });
      if (!subdomains) {
        throw new Error("Subdomains not found");
      }
      if (!count) {
        throw new Error("Count not found");
      }

      return [subdomains, count, null];
    } catch (err) {
      const error = ensure_error(err);
      return [[], 0, error];
    }
  }
  async create_subdomain(
    query: Prisma.subdomainsCreateArgs,
  ): Promise<[subdomains, Error | null]> {
    try {
      const subdomain = await this.client.subdomains.create(query);
      return [subdomain, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as subdomains, error];
    }
  }
  async remove_subdomain(
    subdomains_facilities_query: Prisma.subdomains_facilitiesDeleteManyArgs,
    query: Prisma.subdomainsUpdateArgs,
  ): Promise<Error | null> {
    try {
      await this.client.$transaction(async (tx) => {
        await tx.subdomains_facilities.deleteMany(subdomains_facilities_query);
        await tx.subdomains.update(query);
      });
      return null;
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
  }
  async reactivate_subdomain(
    query: Prisma.subdomainsUpdateArgs,
  ): Promise<[subdomains, Error | null]> {
    try {
      const subdomain = await this.client.subdomains.update(query);
      return [subdomain, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as subdomains, error];
    }
  }
}
