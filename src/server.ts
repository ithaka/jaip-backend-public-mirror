import build from "./build";
import { connect } from "./database/connection";

const services = {
  database: {
    connect,
  },
};
const server = build(
  {
    logger: true,
    trustProxy: true,
  },
  services,
);

const start = async () => {
  try {
    await server.listen({ port: 8080, host: "0.0.0.0" });
    const address = server.server.address();
    server.log.info(address);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
