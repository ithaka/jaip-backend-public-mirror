import { FastifyRequest } from "fastify";
import { get_subdomain } from "../../utils/index.js";

export const add_subdomain = async (request: FastifyRequest) => {
  const url = new URL(request.headers.referer || `https://${request.host}`);
  request.subdomain = get_subdomain(url.hostname);
  return;
};
