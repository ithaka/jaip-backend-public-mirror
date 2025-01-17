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

const fastify: FastifyInstance = Fastify({});

fastify.get("/secret", opts, async () => {
  const url = "http://localhost:8888/v1/apps/PDF-DELIVERY-SERVICE/";
  let str = "";
  try {
    const response = await fetch(url);
    str = JSON.stringify(response);
    fastify.log.info(str);
  } catch (error) {
    fastify.log.error(JSON.stringify(error));
    str = "Failed to fetch";
  }

  return {
    secret: process.env.JAIP_TEST_SECRET,
    service: str,
  };
});

fastify.get("/healthz", opts, async () => {
  return { up: true };
});

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" });
    const address = fastify.server.address();
    const port = typeof address === "string" ? address : address?.port;
    fastify.log.info(address);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
