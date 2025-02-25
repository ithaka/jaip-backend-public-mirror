import { FastifyRequest } from "fastify";

// TODO: Figure out how fastify is handling multiple IPs and update this accordingly
export const ip_handler = (req: FastifyRequest): string[] => {
  const ips = req.ips || [req.ip];
  return ips;
};
