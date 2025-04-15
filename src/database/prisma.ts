import { entity_types, Prisma, PrismaClient } from "@prisma/client";
import { JAIPDatabase } from ".";
import { DBEntity, IPBypassResult } from "../types/database";
import { User } from "../types/entities";

export class PrismaJAIPDatabase implements JAIPDatabase {
  client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
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
}
