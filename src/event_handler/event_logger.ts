import { FastifyRequest } from "fastify";

export interface EventLogger {
  // Add events here. Ex:
  pep_auth_start: (request: FastifyRequest) => void;
}
