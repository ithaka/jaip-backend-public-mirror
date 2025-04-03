import build from "../build";
import { RouteSettings } from "../types/routes";

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
  });

  afterAll(() => app.close());

  return app;
}
