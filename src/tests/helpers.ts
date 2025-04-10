import build from "../build";
import { RouteSettings } from "../types/routes";
import { JAIPDatabase } from "../database";

export const db_mock = {
  get_ip_bypass: jest.fn(),
  get_first_facility: jest.fn(),
  get_first_user: jest.fn(),
  get_sitecode_by_subdomain: jest.fn(),
} as jest.Mocked<JAIPDatabase>;

export const discover_mock = jest.fn() as jest.MockedFunction<
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
