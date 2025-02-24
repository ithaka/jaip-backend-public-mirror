import build from "../build";

export function build_test_server() {
  const app = build({
    logger: true,
    trustProxy: true,
  });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(() => app.close());

  return app;
}
