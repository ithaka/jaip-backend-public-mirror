import { entity_types, Prisma } from "@prisma/client";
import { DBEntity, IPBypassResult, Status } from "../types/database";
import { User } from "../types/entities";
import { Alert } from "../types/alerts";
import { Feature } from "../types/features";

export interface JAIPDatabase {
  // HEALTHCHECK
  get_first_feature: () => Promise<Feature | null>;

  // AUTH
  get_ip_bypass: (
    query: Prisma.ip_bypassFindFirstArgs,
  ) => Promise<IPBypassResult | null>;
  get_first_facility: (
    query: Prisma.facilitiesFindFirstArgs,
  ) => Promise<DBEntity | null>;
  get_first_user: (
    query: Prisma.usersFindFirstArgs,
  ) => Promise<DBEntity | null>;

  // SUBDOMAINS
  get_sitecode_by_subdomain: (
    query: Prisma.subdomains_facilitiesFindFirstArgs,
  ) => Promise<IPBypassResult | null>;

  // ACCOUNT MANAGEMENT
  get_users_and_count: (
    count_query: Prisma.usersCountArgs,
    query: Prisma.usersFindManyArgs,
  ) => Promise<[number, DBEntity[]]>;
  get_facilities_and_count: (
    count_query: Prisma.facilitiesCountArgs,
    query: Prisma.facilitiesFindManyArgs,
  ) => Promise<[number, DBEntity[]]>;
  remove_user: (query: Prisma.usersUpdateArgs) => void;
  remove_facility: (query: Prisma.facilitiesUpdateArgs) => void;
  get_user_id: (
    query: Prisma.usersFindUniqueArgs,
  ) => Promise<{ id: number } | null>;
  get_facility_id: (
    query: Prisma.facilitiesFindUniqueArgs,
  ) => Promise<{ id: number } | null>;
  manage_entity: (
    action: "add" | "edit",
    type: entity_types,
    entity: User,
    is_manager: boolean,
  ) => void;

  // ALERTS
  get_alerts: (query: Prisma.alertsFindFirstArgs) => Promise<Alert | null>;

  // STATUSES
  get_statuses: (
    query: Prisma.statusesFindManyArgs,
  ) => Promise<Status[] | null>;
  create_statuses: (
    query: Prisma.statusesCreateManyInput[],
    comments: string,
    reason?: string,
  ) => Promise<Error | null>;
  create_bulk_statuses: (
    query: Prisma.statusesCreateManyInput[],
  ) => Promise<Error | null>;
  remove_bulk_approval: (
    code: string,
    groups: number[],
    user_id: number,
  ) => Promise<[Prisma.statusesCreateManyInput[] | null, Error | null]>;
  create_approvals: (
    doi: string,
    groups: number[],
    user_id: number,
  ) => Promise<Error | null>;
}
