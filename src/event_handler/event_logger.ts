import { FastifyRequest } from "fastify";

export interface EventLogger {
  // Add events here. Ex:
  pep_auth_start: (request: FastifyRequest) => void;
  pep_server_error: (request: FastifyRequest, error: Error) => void;
  pep_healthcheck_error: (type: string, error: Error) => void;
  pep_error: (type: string, error: Error) => void;
}
