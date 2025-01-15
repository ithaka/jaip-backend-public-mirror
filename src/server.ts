import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";

const server: FastifyInstance = Fastify({});

const opts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: "object",
        properties: {
          pong: {
            type: "string",
          },
          up: {
            type: "boolean",
          },
        },
      },
    },
  },
};

server.get("/healthz", opts, async () => {
  return { up: true };
});

const start = async () => {
  try {
    await server.listen({ port: 8080 });

    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;

    console.log(address, port);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
