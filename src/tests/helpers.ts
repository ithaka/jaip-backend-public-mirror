import { afterAll, beforeAll, Mock, vi } from "vitest";
import build from "../build.js";
import { RouteSettings } from "../types/routes.js";
import type { JAIPDatabase } from "../database/index.js";
import { FastifyInstance } from "fastify";

export const db_mock = {
  get_first_feature: vi.fn().mockName("get_first_feature"),
  get_ip_bypass: vi.fn().mockName("get_ip_bypass"),
  get_first_facility: vi.fn().mockName("get_first_facility"),
  get_first_user: vi.fn().mockName("get_first_user"),
  get_sitecode_by_subdomain: vi.fn().mockName("get_sitecode_by_subdomain"),
  get_users_and_count: vi.fn().mockName("get_users_and_count"),
  get_facilities_and_count: vi.fn().mockName("get_facilities_and_count"),
  get_facilities: vi.fn().mockName("get_facilities"),
  remove_user: vi.fn().mockName("remove_user"),
  remove_facility: vi.fn().mockName("remove_facility"),
  get_user_id: vi.fn().mockName("get_user_id"),
  get_facility_id: vi.fn().mockName("get_facility_id"),
  manage_entity: vi.fn().mockName("manage_entity"),
  get_alerts: vi.fn().mockName("get_alerts"),
  get_statuses: vi.fn().mockName("get_statuses"),
  get_item_status: vi.fn().mockName("get_item_status"),
  create_request_statuses: vi.fn().mockName("create_requests"),
  create_statuses: vi.fn().mockName("create_requests"),
  remove_bulk_approval: vi.fn().mockName("remove_bulk_approval"),
  create_bulk_statuses: vi.fn().mockName("create_bulk_statuses"),
  create_approvals: vi.fn().mockName("create_approvals"),
  get_all_tokens: vi.fn().mockName("get_all_tokens"),
  get_search_statuses: vi.fn().mockName("get_search_statuses"),
  get_valid_subdomain: vi.fn().mockName("get_subdomain"),
  get_subdomains_and_count: vi.fn().mockName("get_subdomains_and_count"),
  create_subdomain: vi.fn().mockName("create_subdomain"),
  remove_subdomain: vi.fn().mockName("remove_subdomain"),
  update_subdomain: vi.fn().mockName("update_subdomain"),
  get_groups_and_count: vi.fn().mockName("get_groups_and_count"),
  create_group: vi.fn().mockName("create_group"),
  remove_group: vi.fn().mockName("remove_group"),
  update_group: vi.fn().mockName("update_group"),
  clear_history: vi.fn().mockName("clear_history"),
  create_group_admin: vi.fn().mockName("create_group_admin"),
  get_grouped_features_and_count: vi
    .fn()
    .mockName("get_grouped_features_and_count"),
  create_grouped_feature: vi.fn().mockName("create_grouped_feature"),
  remove_grouped_feature: vi.fn().mockName("remove_grouped_feature"),
  update_grouped_feature: vi.fn().mockName("update_grouped_feature"),
  get_ungrouped_features_and_count: vi
    .fn()
    .mockName("get_ungrouped_features_and_count"),
  create_ungrouped_feature: vi.fn().mockName("create_ungrouped_feature"),
  remove_ungrouped_feature: vi.fn().mockName("remove_ungrouped_feature"),
  update_ungrouped_feature: vi.fn().mockName("update_ungrouped_feature"),
  create_restricted_item: vi.fn().mockName("create_restricted_item"),
  remove_restricted_item: vi.fn().mockName("remove_restricted_item"),
  get_restricted_items: vi.fn().mockName("get_restricted_items"),
  get_restricted_items_and_count: vi
    .fn()
    .mockName("get_restricted_items_and_count"),
  get_last_updated_restricted_item: vi
    .fn()
    .mockName("get_last_updated_restricted_item"),
  get_targeted_alerts_and_count: vi
    .fn()
    .mockName("get_targeted_alerts_and_count"),
  create_targeted_alert: vi.fn().mockName("create_targeted_alert"),
  update_targeted_alert: vi.fn().mockName("update_targeted_alert"),
  remove_targeted_alert: vi.fn().mockName("remove_targeted_alert"),
  get_collection_ids: vi.fn().mockName("get_collection_ids"),
} as JAIPDatabase as Record<keyof JAIPDatabase, Mock>;

export const discover_mock = vi.fn().mockName("discover");

export function build_test_server(route_settings: RouteSettings[]) {
  const app = build(
    {
      logger: true,
      trustProxy: true,
    },
    route_settings,
  );

  beforeAll(async () => {
    await app.ready();
    (app as FastifyInstance).db = db_mock as unknown as JAIPDatabase;
    (app as FastifyInstance).discover = discover_mock;
  });

  afterAll(async () => {
    await app.close();
  });

  return app;
}
