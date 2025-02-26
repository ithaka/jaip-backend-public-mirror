import { FastifyReply, FastifyRequest } from "fastify";
import { User } from "../types/entities";
export interface CaptainsLog {
  origin: string;
  eventtype: string;
  dests: string[];
  requestid: string;
  eventid: string;
  tstamp_usec: Date;
  delivered_by: string;
}

export interface LogPayload {
  user?: User;
  sessionid?: string;
}
export interface EventLogger {
  // ERRORS
  pep_server_error: (request: FastifyRequest, error: Error) => void;
  pep_healthcheck_error: (type: string, error: Error) => void;
  pep_error: (
    request: FastifyRequest,
    reply: FastifyReply,
    payload: object,
    type: string,
    error: Error,
  ) => void;
  pep_unauthorized_error: (
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) => void;
  pep_forbidden_error: (
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) => void;

  // AUTH
  pep_auth_start: (request: FastifyRequest) => void;
  pep_auth_complete: (
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) => void;
  pep_validate_subdomain_start: (
    request: FastifyRequest,
    subdomain: string,
  ) => void;
}
