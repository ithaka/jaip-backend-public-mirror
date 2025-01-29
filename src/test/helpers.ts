import build from "../build";

export function build_test_server() {
  const services = {
    database: {
      connect: jest.fn(),
    },
  };

  const app = build(
    {
      logger: true,
      trustProxy: true,
    },
    services,
  );

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(() => app.close());

  return app;
}
