import build from "../build";
import { RouteSettings } from "../types/routes";
import { JAIPDatabase } from "../database";

export const db_mock = {
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
