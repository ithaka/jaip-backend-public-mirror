import { FastifySchema } from "fastify";
import { FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifySchema {
    route?: string;
  }
}

// Many routes are simply the root path. This function returns that as a default, allowing
// it to be unspecified in the schema.
export const get_route = (schema: FastifySchema): string => {
  if (schema?.route) {
    return schema.route;
  }
  return "/";
};

export const ip_handler = (req: FastifyRequest): string[] => {
  const ips = req.headers["fastly-client-ip"]
    ? [req.headers["fastly-client-ip"] as string]
    : [];
  return ips;
};

export const get_subdomain = (host: string): string => {
  return host.split(".").slice(0, -2).join(".");
};

export const server_error = {
  500: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
};
export const standard_errors = {
  401: {
    description: "Unauthorized",
  },
  403: {
    description: "Forbidden",
  },
  ...server_error,
};

export const standard_post_errors = {
  400: {
    description: "Bad Request",
  },
  ...standard_errors,
};
