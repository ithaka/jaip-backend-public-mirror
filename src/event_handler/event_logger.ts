import { FastifyRequest } from "fastify";

export interface EventLogger {
  // Add events here. Ex:
  pep_auth_start: (request: FastifyRequest) => void;
  pep_server_error: (request: FastifyRequest, error: Error) => void;
}
