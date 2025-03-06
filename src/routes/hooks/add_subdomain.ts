import { FastifyRequest } from "fastify";
import { get_subdomain } from "../../utils";

export const add_subdomain = async (request: FastifyRequest) => {
  request.subdomain = get_subdomain(request.host);
  return;
};
