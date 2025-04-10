import { Prisma } from "@prisma/client";
import { DBEntity, IPBypassResult } from "../types/database";

export interface JAIPDatabase {
  get_ip_bypass: (
    query: Prisma.ip_bypassFindFirstArgs,
  ) => Promise<IPBypassResult | null>;
  get_first_facility: (
    query: Prisma.facilitiesFindFirstArgs,
  ) => Promise<DBEntity | null>;
  get_first_user: (
    query: Prisma.usersFindFirstArgs,
  ) => Promise<DBEntity | null>;
  get_sitecode_by_subdomain: (
    query: Prisma.subdomains_facilitiesFindFirstArgs,
  ) => Promise<IPBypassResult | null>;
}
