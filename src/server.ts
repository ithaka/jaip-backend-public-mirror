import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
// import "dotenv/config";

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
        },
      },
    },
  },
};

const server: FastifyInstance = Fastify({});

server.get("/secret", opts, async () => {
  return { secret: process.env };
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
