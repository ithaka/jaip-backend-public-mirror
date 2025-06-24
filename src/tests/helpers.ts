import build from "../build";
import { RouteSettings } from "../types/routes";
import { JAIPDatabase } from "../database";

export const db_mock = {
  get_first_feature: jest.fn().mockName("get_first_feature"),
  get_ip_bypass: jest.fn().mockName("get_ip_bypass"),
  get_first_facility: jest.fn().mockName("get_first_facility"),
  get_first_user: jest.fn().mockName("get_first_user"),
  get_sitecode_by_subdomain: jest.fn().mockName("get_sitecode_by_subdomain"),
  get_users_and_count: jest.fn().mockName("get_users_and_count"),
  get_facilities_and_count: jest.fn().mockName("get_facilities_and_count"),
  remove_user: jest.fn().mockName("remove_user"),
  remove_facility: jest.fn().mockName("remove_facility"),
  get_user_id: jest.fn().mockName("get_user_id"),
  get_facility_id: jest.fn().mockName("get_facility_id"),
  manage_entity: jest.fn().mockName("manage_entity"),
  get_alerts: jest.fn().mockName("get_alerts"),
  get_statuses: jest.fn().mockName("get_statuses"),
  get_item_status: jest.fn().mockName("get_item_status"),
  create_request_statuses: jest.fn().mockName("create_requests"),
  create_statuses: jest.fn().mockName("create_requests"),
  remove_bulk_approval: jest.fn().mockName("remove_bulk_approval"),
  create_bulk_statuses: jest.fn().mockName("create_bulk_statuses"),
  create_approvals: jest.fn().mockName("create_approvals"),
  get_all_tokens: jest.fn().mockName("get_all_tokens"),
  get_search_statuses: jest.fn().mockName("get_search_statuses"),
  get_valid_subdomain: jest.fn().mockName("get_subdomain"),
  get_subdomains_and_count: jest.fn().mockName("get_subdomains_and_count"),
  create_subdomain: jest.fn().mockName("create_subdomain"),
  remove_subdomain: jest.fn().mockName("remove_subdomain"),
  update_subdomain: jest.fn().mockName("update_subdomain"),
  get_groups_and_count: jest.fn().mockName("get_groups_and_count"),
  create_group: jest.fn().mockName("create_group"),
  remove_group: jest.fn().mockName("remove_group"),
  update_group: jest.fn().mockName("update_group"),
  clear_history: jest.fn().mockName("clear_history"),
  create_group_admin: jest.fn().mockName("create_group_admin"),
  get_grouped_features_and_count: jest
    .fn()
    .mockName("get_grouped_features_and_count"),
  create_grouped_feature: jest.fn().mockName("create_grouped_feature"),
  remove_grouped_feature: jest.fn().mockName("remove_grouped_feature"),
  update_grouped_feature: jest.fn().mockName("update_grouped_feature"),
  get_ungrouped_features_and_count: jest
    .fn()
    .mockName("get_ungrouped_features_and_count"),
  create_ungrouped_feature: jest.fn().mockName("create_ungrouped_feature"),
  remove_ungrouped_feature: jest.fn().mockName("remove_ungrouped_feature"),
  update_ungrouped_feature: jest.fn().mockName("update_ungrouped_feature"),
  create_blocked_item: jest.fn().mockName("create_blocked_item"),
  remove_blocked_item: jest.fn().mockName("remove_blocked_item"),
  get_blocked_items: jest.fn().mockName("get_blocked_items"),
} as jest.Mocked<JAIPDatabase>;

export const discover_mock = jest
  .fn()
  .mockName("discover") as jest.MockedFunction<
  (service: string) => Promise<[string, Error | null]>
>;
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
    app.db = db_mock;
    app.discover = discover_mock;
  });

  afterAll(() => app.close());

  return app;
}
