import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import "dotenv/config";

const opts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: "object",
        properties: {
          up: {
            type: "boolean",
          },
          secret: {
            type: "string",
          },
          service: {
            type: "string",
          },
        },
      },
    },
  },
};

const server: FastifyInstance = Fastify({});

server.get("/secret", opts, async () => {
  const url = "http://0.0.0.0:8888/v1/apps/iac-service/instances";
  let str = "";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const resp = await response;
    str = JSON.stringify(resp);
    console.log(str);
  } catch (error) {
    console.error(JSON.stringify(error));
  }

  return {
    secret: process.env.JAIP_TEST_SECRET,
    service: str,
  };
});

server.get("/healthz", opts, async () => {
  return { up: true };
});

const start = async () => {
  try {
    await server.listen({ port: 8080, host: "0.0.0.0" });
    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;

    console.log(address, port);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
