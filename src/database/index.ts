import {
  entity_types,
  features,
  groups,
  Prisma,
  status_options,
  ungrouped_features,
} from "@prisma/client";
import { DBEntity, IPBypassResult, Status } from "../types/database";
import { User } from "../types/entities";
import { Alert } from "../types/alerts";
import { Feature } from "../types/features";
import { Subdomain } from "../types/routes";

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
  get_valid_subdomain: (
    target: string,
  ) => Promise<[{ subdomain: string } | null, Error | null]>;

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
  get_alerts: () => Promise<[Alert | null, Error | null]>;

  // STATUSES
  get_statuses: (
    query: Prisma.statusesFindManyArgs,
  ) => Promise<[Status[], Error | null]>;
  get_item_status: (
    query: Prisma.statusesFindFirstArgs,
  ) => Promise<[Status | null, Error | null]>;
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
  get_search_statuses: (
    query_string: string,
    groups: number[],
    query_statuses: status_options[],
    start_date: Date,
    end_date: Date,
    sort: string,
    limit: number,
    page: number,
  ) => Promise<[Status[] | null, number | null, Error | null]>;

  // TOKENS
  get_all_tokens: () => Promise<[string[], Error | null]>;

  // SITE ADMINISTRATION
  
  // SUBDOMAINS
  get_subdomains_and_count: (
    count_query: Prisma.subdomainsCountArgs,
    query: Prisma.subdomainsFindManyArgs,
  ) => Promise<[Subdomain[], number, Error | null]>;
  create_subdomain: (name: string) => Promise<[Subdomain, Error | null]>;
  remove_subdomain: (id: number) => Promise<Error | null>;
  update_subdomain: (
    subdomains_query: Prisma.subdomainsUpdateArgs,
  ) => Promise<[Subdomain, Error | null]>;

  // GROUPS
  get_groups_and_count: (
    count_query: Prisma.groupsCountArgs,
    query: Prisma.groupsFindManyArgs,
  ) => Promise<[groups[], number, Error | null]>;
  create_group: (name: string) => Promise<[groups, Error | null]>;
  remove_group: (id: number) => Promise<Error | null>;
  update_group: (
    subdomains_query: Prisma.groupsUpdateArgs,
  ) => Promise<[groups, Error | null]>;

  // STATUS HISTORY
  clear_history: (group_id: number) => Promise<Error | null>;

  // GROUP ADMIN
  create_group_admin: (user_id: number) => Promise<Error | null>;

  // GROUPED FEATURES
  get_grouped_features_and_count: (
    count_query: Prisma.featuresCountArgs,
    query: Prisma.featuresFindManyArgs,
  ) => Promise<[features[], number, Error | null]>;
  create_grouped_feature: (
    query: Prisma.featuresCreateArgs,
  ) => Promise<[features, Error | null]>;
  remove_grouped_feature: (id: number) => Promise<Error | null>;
  update_grouped_feature: (
    query: Prisma.featuresUpdateArgs,
  ) => Promise<[features, Error | null]>;

  // UNGROUPED FEATURES
  get_ungrouped_features_and_count: (
    count_query: Prisma.ungrouped_featuresCountArgs,
    query: Prisma.ungrouped_featuresFindManyArgs,
  ) => Promise<[ungrouped_features[], number, Error | null]>;
  create_ungrouped_feature: (
    query: Prisma.ungrouped_featuresCreateArgs,
  ) => Promise<[ungrouped_features, Error | null]>;
  remove_ungrouped_feature: (id: number) => Promise<Error | null>;
  update_ungrouped_feature: (
    subdomains_query: Prisma.ungrouped_featuresUpdateArgs,
  ) => Promise<[ungrouped_features, Error | null]>;
}
