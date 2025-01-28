import { EventLogger } from "../event_logger";
import { v4 as uuidv4 } from "uuid";
import { FastifyRequest } from "fastify";

export class CaptainsLogger implements EventLogger {
  _log(eventtype: string, payload: object) {
    console.log(
      JSON.stringify({
        origin: "jaip-backend",
        eventtype: eventtype,
        dests: ["captains-log"],
        requestid: uuidv4(),
        eventid: uuidv4(),
        tstamp_usec: Date.now() * 1000,
        delivered_by: "labs",
        ...payload,
      }),
    );
  }

  _add_request_fields(request: FastifyRequest) {
    return {
      ip_address: request.ip,
      user_agent: request.headers["user-agent"],
      uuid: request.cookies.uuid,
      host: request.host,
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
  pep_error(type: string, error: Error) {
    this._log("pep_error", {
      log_made_by: "error-handler",
      event_description: "error",
      type,
      error_message: error.message,
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
  pep_validate_subdomain_start(request: FastifyRequest, subdomain: string) {
    this._log("pep_validate_subdomain_start", {
      log_made_by: "auth-api",
      event_description: `to get subdomain: ${subdomain}`,
      ...this._add_request_fields(request),
    });
  }
}
