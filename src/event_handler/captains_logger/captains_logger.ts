import { EventLogger, LogPayload } from "../event_logger";
import { v4 as uuidv4 } from "uuid";
import { FastifyReply, FastifyRequest } from "fastify";
import { get_subdomain } from "../../utils";

export class CaptainsLogger implements EventLogger {
  #base_log = {
    origin: "jaip-backend",
    dests: ["captains-log"],
    requestid: uuidv4(),
    eventid: uuidv4(),
    delivered_by: "labs",
  };
  _log(eventtype: string, payload: object) {
    console.log(
      JSON.stringify({
        eventtype: eventtype,
        tstamp_usec: Date.now() * 1000,
        ...this.#base_log,
        ...payload,
      }),
    );
  }

  _add_request_fields(request: FastifyRequest) {
    return {
      ip_address: request.ip,
      requestid: request.id,
      user_agent: request.headers["user-agent"],
      uuid: request.cookies.uuid,
      host: request.host,
      subdomain: get_subdomain(request.host),
      request_headers: request.headers,
      request_body: request.body,
    };
  }

  _add_reply_fields(reply: FastifyReply) {
    return {
      response_status: reply.statusCode,
      response_headers: reply.getHeaders(),
      response_sent: reply.sent,
    };
  }

  // ERRORS
  pep_server_error(request: FastifyRequest, error: Error) {
    this._log("pep_server_error", {
      log_made_by: "error-handler",
      event_description: "error",
      error_message: error.message,
      ...this._add_request_fields(request),
    });
  }
  pep_healthcheck_error(type: string, error: Error) {
    this._log("pep_healthcheck_error", {
      log_made_by: "healthcheck",
      event_description: "error",
      type,
      error_message: error.message,
    });
  }
  pep_forbidden_error(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) {
    this._log("pep_forbidden_error", {
      log_made_by: "error-handler",
      event_description: "error",
      type: "pep_forbidden_error",
      ...this._add_request_fields(request),
      ...this._add_reply_fields(reply),
      ...payload,
    });
  }

  pep_unauthorized_error(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) {
    this._log("pep_unauthorized_error", {
      log_made_by: "error-handler",
      event_description: "error",
      type: "pep_unauthorized_error",
      ...this._add_request_fields(request),
      ...this._add_reply_fields(reply),
      ...payload,
    });
  }

  pep_error(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: object,
    type: string,
    error: Error,
  ) {
    this._log("pep_error", {
      log_made_by: "error-handler",
      event_description: "error",
      type,
      error_message: error.message,
      ...this._add_request_fields(request),
      ...this._add_reply_fields(reply),
      ...payload,
    });
  }

  // AUTH
  pep_auth_start(request: FastifyRequest) {
    this._log("pep_auth_start", {
      log_made_by: "auth-api",
      event_description: "attempting auth",
      ...this._add_request_fields(request),
    });
  }
  pep_auth_complete(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) {
    this._log("pep_auth_complete", {
      log_made_by: "auth-api",
      event_description: "user authenticated and authorized",
      ...this._add_request_fields(request),
      ...this._add_reply_fields(reply),
      ...payload,
    });
  }
  pep_validate_subdomain_start(request: FastifyRequest, subdomain: string) {
    this._log("pep_validate_subdomain_start", {
      log_made_by: "auth-api",
      event_description: `to get subdomain: ${subdomain}`,
      ...this._add_request_fields(request),
    });
  }
}
