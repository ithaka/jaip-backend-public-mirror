import { Prisma, PrismaClient } from "@prisma/client";
import { JAIPDatabase } from ".";
import { DBEntity, IPBypassResult } from "../types/database";

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
}
