import { FastifyInstance, RouteShorthandOptions } from "fastify";
import axios from "axios";

const schema = {
  response: {
    200: {
      type: "object",
      properties: {
        up: { type: "boolean" },
        service_discovery: { type: "boolean" },
      },
    },
  },
};

const polarisHealthcheck = async () => {
  const url = "http://localhost:8888/healthcheck";
  let up = false;
  try {
    const { data, status } = await axios.get(url);
    up = data === "ok" && status === 200;
  } catch (err) {
    up = false;
  }
  return up;
};

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  fastify.get("/healthz", opts, async () => {
    opts.schema = schema;

    const service_discovery = await polarisHealthcheck();
    return {
      up: true,
      service_discovery,
    };
  });
}

export default routes;
