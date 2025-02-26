import build from "./build";
import { v4 as uuidv4 } from "uuid";

const server = build({
  logger: true,
  trustProxy: true,
  genReqId: () => {
    return uuidv4();
  },
});

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
