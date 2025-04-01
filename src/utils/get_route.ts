import { FastifySchema } from "fastify";

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
