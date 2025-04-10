import build from "../build";
import { RouteSettings } from "../types/routes";
import { JAIPDatabase } from "../database";

export const dbMock = {
  get_ip_bypass: jest.fn(),
  get_first_facility: jest.fn(),
  get_first_user: jest.fn(),
  get_sitecode_by_subdomain: jest.fn(),
} as jest.Mocked<JAIPDatabase>;

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
    console.log("Replacing db with mock");
    app.db = dbMock;
  });

  afterAll(() => app.close());

  return app;
}
