import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import "dotenv/config";
import axios from "axios";
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

const fastify: FastifyInstance = Fastify({
  logger: true,
});
fastify.get("/", opts, async () => {
  fastify.log.info("Starting Polaris Healthcheck");
  const url = "http://localhost:8888/healthcheck";
  let str = "";
  try {
    const response = await axios.get(url);
    str = typeof response;
    console.log("Polaris Healthcheck Response:", str);
    console.log("Polaris Healthcheck Data:", response.data);
    console.log("Polaris Healthcheck Status:", response.status);
  } catch (err) {
    console.log(
      "Polaris Healthcheck Error:",
      JSON.stringify(err, Object.getOwnPropertyNames(err)),
    );
    str = "Failed to Healthcheck";
  }

  fastify.log.info("Ending Polaris Healthcheck");
  return {
    up: str,
  };
});
fastify.get("/secret", opts, async () => {
  fastify.log.info("Starting Get Secret");
  const url = "http://localhost:8888/v1/apps/pdf-delivery-service/instances";
  let str = "";
  try {
    const response = await axios.get(url);
    str = JSON.stringify(response);
    console.log("Polaris Response:", str);
    console.log("Polaris Data:", response.data);
    console.log("Polaris Status:", response.status);
  } catch (err) {
    console.log(
      "Error:",
      JSON.stringify(err, Object.getOwnPropertyNames(err)),
      typeof err,
    );
    str = "Failed to fetch";
  }

  fastify.log.info("Ending Get Secret");
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
