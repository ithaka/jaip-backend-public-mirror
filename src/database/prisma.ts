import {
  entity_types,
  groups,
  jstor_types,
  Prisma,
  PrismaClient,
  status_options,
  user_roles,
  features,
  ungrouped_features,
} from "@prisma/client";
import { JAIPDatabase } from ".";
import { DBEntity, IPBypassResult, Status } from "../types/database";
import { User } from "../types/entities";
import { ensure_error } from "../utils";
import { Alert } from "../types/alerts";
import { Subdomain } from "../types/routes";

export class PrismaJAIPDatabase implements JAIPDatabase {
  client: PrismaClient;

  constructor(client: PrismaClient) {
    client.$on(
      // @ts-expect-error Prisma typing doesn't seem to work for the event emitter
      "query",
      (e: { query: string; params: string; duration: number }) => {
        console.log("Query: " + e.query);
        console.log("Params: " + e.params);
        console.log("Duration: " + e.duration + "ms");
      },
    );
    client.$on(
      // @ts-expect-error Prisma typing doesn't seem to work for the event emitter
      "error",
      (e: { query: string; params: string; duration: number }) => {
        console.log("Error: " + JSON.stringify(e));
      },
    );
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
    target: string,
  ): Promise<[{ subdomain: string } | null, Error | null]> {
    try {
      const subdomain = await this.client.subdomains.findFirst({
        where: {
          subdomain: target,
          is_active: true,
        },
        select: {
          subdomain: true,
        },
      });
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
    const procedure = `${action}_${type}`;
    switch (procedure) {
      case "add_facilities":
        await this.client.$queryRaw(
          Prisma.sql`CALL add_facilities(${entity}::json,${is_manager})`,
        );
        break;
      case "edit_facilities":
        await this.client.$queryRaw(
          Prisma.sql`CALL edit_facilities(${entity}::json,${is_manager})`,
        );
        break;
      case "add_users":
        await this.client.$queryRaw(
          Prisma.sql`CALL add_users(${entity}::json,${is_manager})`,
        );
        break;
      case "edit_users":
        await this.client.$queryRaw(
          Prisma.sql`CALL edit_users(${entity}::json,${is_manager})`,
        );
        break;
      default:
        throw new Error("Invalid action");
    }
  }

  async get_alerts(): Promise<[Alert | null, Error | null]> {
    try {
      const result = await this.client.alerts.findFirst({
        where: {
          created_at: {
            lte: new Date(),
          },
          expires_at: {
            gte: new Date(),
          },
        },
        select: {
          text: true,
          status: true,
        },
        orderBy: {
          id: "desc",
        },
      });
      return [result, null];
    } catch (err) {
      const error = ensure_error(err);
      return [null, error];
    }
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
      const existing_statuses = await this.client.statuses.findMany({
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
      if (!existing_statuses || !existing_statuses.length) {
        throw new Error(
          "undo error: no existing statuses found for provided code in the provided groups",
        );
      }
      existing_statuses.forEach((status) => {
        db_inserts.push({
          jstor_item_type: status.jstor_item_type,
          jstor_item_id: code,
          status: status_options.Denied,
          entity_id: user_id,
          group_id: status.group_id,
        });
      });
      // It would be possible to do this in a single query by passing the existing item type in the
      // request. This approach places minimal trust in the request
      await this.client.statuses.createMany({
        data: db_inserts,
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
      return [statuses as unknown as Status[], count || 0, null];
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
  ): Promise<[Subdomain[], number, Error | null]> {
    try {
      const [count, subdomains] = await this.client.$transaction(async (tx) => {
        const count = await tx.subdomains.count(count_query);
        const subdomains = (await tx.subdomains.findMany(query)) || [];
        return [count, subdomains];
      });
      if (!subdomains) {
        throw new Error("Subdomains not found");
      }

      return [subdomains, count || 0, null];
    } catch (err) {
      const error = ensure_error(err);
      return [[], 0, error];
    }
  }
  async create_subdomain(name: string): Promise<[Subdomain, Error | null]> {
    try {
      const subdomain = await this.client.subdomains.create({
        data: {
          subdomain: name,
          entity_type: entity_types.facilities,
          is_active: true,
          updated_at: new Date(),
        },
      });
      return [subdomain, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as Subdomain, error];
    }
  }
  async remove_subdomain(id: number): Promise<Error | null> {
    try {
      await this.client.$transaction(async (tx) => {
        await tx.subdomains_facilities.deleteMany({
          where: {
            subdomains: {
              id: id,
            },
          },
        });
        await tx.subdomains.update({
          where: {
            id,
          },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        });
      });
      return null;
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
  }
  async update_subdomain(
    query: Prisma.subdomainsUpdateArgs,
  ): Promise<[Subdomain, Error | null]> {
    try {
      const subdomain = await this.client.subdomains.update(query);
      return [subdomain, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as Subdomain, error];
    }
  }
  async get_groups_and_count(
    count_query: Prisma.groupsCountArgs,
    query: Prisma.groupsFindManyArgs,
  ): Promise<[groups[], number, Error | null]> {
    try {
      const [count, groups] = await this.client.$transaction(async (tx) => {
        const count = await tx.groups.count(count_query);
        const groups = (await tx.groups.findMany(query)) || [];
        return [count, groups];
      });
      if (!groups) {
        throw new Error("Groups not found");
      }

      return [groups, count || 0, null];
    } catch (err) {
      const error = ensure_error(err);
      return [[], 0, error];
    }
  }
  async create_group(name: string): Promise<[groups, Error | null]> {
    try {
      const group = await this.client.groups.create({
        data: {
          name: name,
        },
      });
      return [group, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as groups, error];
    }
  }
  async remove_group(id: number): Promise<Error | null> {
    try {
      await this.client.$transaction(async (tx) => {
        await tx.groups_entities.updateMany({
          where: {
            group_id: id,
          },
          data: {
            role: user_roles.removed,
            updated_at: new Date(),
          },
        });
        await tx.features_groups_entities.updateMany({
          where: {
            group_id: id,
          },
          data: {
            enabled: false,
            updated_at: new Date(),
          },
        });
        await tx.groups.update({
          where: {
            id: id,
          },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        });
      });
      return null;
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
  }
  async update_group(
    query: Prisma.groupsUpdateArgs,
  ): Promise<[groups, Error | null]> {
    try {
      const group = await this.client.groups.update(query);
      return [group, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as groups, error];
    }
  }
  async clear_history(group_id: number): Promise<Error | null> {
    try {
      await this.client.statuses.deleteMany({
        where: {
          group_id: group_id,
        },
      });
      return null;
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
  }

  async create_group_admin(user_id: number): Promise<Error | null> {
    try {
      await this.client.$transaction(async (tx) => {
        await tx.$queryRaw`CALL add_admin_to_active_groups(${user_id}::INT)`;
      });
      return null;
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
  }

  async get_grouped_features_and_count(
    count_query: Prisma.featuresCountArgs,
    query: Prisma.featuresFindManyArgs,
  ): Promise<[features[], number, Error | null]> {
    try {
      const [features, count] = await this.client.$transaction(async (tx) => {
        const features = await tx.features.findMany({
          orderBy: {
            display_name: "asc",
          },
          ...query,
        });
        const count = await tx.features.count(count_query);
        return [features, count];
      });
      if (!features) {
        throw new Error("Features not found");
      }

      return [features, count || 0, null];
    } catch (err) {
      const error = ensure_error(err);
      return [[], 0, error];
    }
  }
  async create_grouped_feature(
    query: Prisma.featuresCreateArgs,
  ): Promise<[features, Error | null]> {
    try {
      const feature = await this.client.features.create(query);
      return [feature, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as features, error];
    }
  }
  async remove_grouped_feature(id: number): Promise<Error | null> {
    try {
      await this.client.$transaction(async (tx) => {
        await tx.features_groups_entities.updateMany({
          where: {
            feature_id: {
              equals: id,
            },
          },
          data: {
            enabled: false,
            updated_at: new Date(),
          },
        });
        await tx.features.update({
          where: {
            id,
          },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        });
      });
      return null;
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
  }
  async update_grouped_feature(
    query: Prisma.featuresUpdateArgs,
  ): Promise<[features, Error | null]> {
    try {
      const feature = await this.client.features.update(query);
      return [feature, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as features, error];
    }
  }
  async get_ungrouped_features_and_count(
    count_query: Prisma.ungrouped_featuresCountArgs,
    query: Prisma.ungrouped_featuresFindManyArgs,
  ): Promise<[ungrouped_features[], number, Error | null]> {
    try {
      const [features, count] = await this.client.$transaction(async (tx) => {
        const features = await tx.ungrouped_features.findMany({
          orderBy: {
            display_name: "asc",
          },
          ...query,
        });
        const count = await tx.ungrouped_features.count(count_query);
        return [features, count];
      });
      if (!features) {
        throw new Error("Features not found");
      }

      return [features, count || 0, null];
    } catch (err) {
      const error = ensure_error(err);
      return [[], 0, error];
    }
  }

  async create_ungrouped_feature(
    query: Prisma.ungrouped_featuresCreateArgs,
  ): Promise<[ungrouped_features, Error | null]> {
    try {
      const feature = await this.client.ungrouped_features.create(query);
      return [feature, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as features, error];
    }
  }
  async remove_ungrouped_feature(id: number): Promise<Error | null> {
    try {
      await this.client.$transaction(async (tx) => {
        await tx.ungrouped_features_entities.updateMany({
          where: {
            feature_id: {
              equals: id,
            },
          },
          data: {
            enabled: false,
            updated_at: new Date(),
          },
        });
        await tx.ungrouped_features.update({
          where: {
            id,
          },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        });
      });
      return null;
    } catch (err) {
      const error = ensure_error(err);
      return error;
    }
  }

  async update_ungrouped_feature(
    query: Prisma.ungrouped_featuresUpdateArgs,
  ): Promise<[ungrouped_features, Error | null]> {
    try {
      const feature = await this.client.ungrouped_features.update(query);
      return [feature, null];
    } catch (err) {
      const error = ensure_error(err);
      return [{} as ungrouped_features, error];
    }
  }
}
