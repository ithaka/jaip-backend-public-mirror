import { EventLogger, LogPayload } from "../../types/event_logger.js";
import { v4 as uuidv4 } from "uuid";
import { FastifyReply, FastifyRequest } from "fastify";
import { User } from "../../types/entities.js";
export class CaptainsLogger implements EventLogger {
  #base_log = {
    origin: "jaip-backend",
    dests: ["captains-log"],
    delivered_by: "labs",
  };
  _log(eventtype: string, payload: object) {
    console.log(
      JSON.stringify({
        ...this.#base_log,
        eventtype: eventtype,
        tstamp_usec: Date.now() * 1000,
        requestid: uuidv4(),
        eventid: uuidv4(),
        ...payload,
      }),
    );
  }

  _add_request_fields(request: FastifyRequest) {
    return {
      ip_address: request.headers["fastly-client-ip"]
        ? request.headers["fastly-client-ip"]
        : request.ip,
      requestid: request.headers["x-request-id"] || request.id,
      user_agent: request.headers["user-agent"],
      uuid: request.cookies.uuid,
      host: request.host,
      subdomain: request.subdomain,
      request_headers: request.headers as Record<string, string>,
      request_body: request.body,
      user: request.user as User,
      group_ids: request.user?.groups.map((group) => group.id),
      sessionid: request.session?.uuid,
      path: request.routeOptions.url,
      user_groups: request.user?.groups.map((group) => group.name),
      user_name: request.user?.name,
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
    payload.log_made_by = "error-handler";
    payload.event_description =
      "user is not authorized to access this resource";
    this._log("pep_forbidden_error", {
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
      event_description:
        "user is not authenticated and must be to access this resource",
      type: "pep_unauthorized_error",
      ...this._add_request_fields(request),
      ...this._add_reply_fields(reply),
      ...payload,
    });
  }

  pep_bad_request_error(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) {
    this._log("pep_bad_request_error", {
      log_made_by: "error-handler",
      event_description:
        "the request schema is not valid and cannot be processed",
      type: "pep_bad_request_error",
      ...this._add_request_fields(request),
      ...this._add_reply_fields(reply),
      ...payload,
    });
  }

  pep_error(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
    type: string,
    error: Error,
  ) {
    payload.log_made_by = "error-handler";
    if (!payload.event_description) {
      payload.event_description = "an error occurred";
    }
    this._log("pep_error", {
      type,
      error_message: error.message,
      ...this._add_request_fields(request),
      ...this._add_reply_fields(reply),
      ...payload,
    });
  }

  // GENERAL LOGGING
  pep_standard_log_start(
    type: string,
    request: FastifyRequest,
    payload: LogPayload,
  ) {
    this._log(type, {
      ...this._add_request_fields(request),
      ...payload,
    });
  }
  pep_standard_log_complete(
    type: string,
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) {
    this._log(type, {
      ...this._add_request_fields(request),
      ...this._add_reply_fields(reply),
      ...payload,
    });
  }
}
