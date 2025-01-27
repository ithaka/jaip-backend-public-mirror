import { EventLogger } from "../event_logger";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../types/users";
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

  pep_auth_start(request: FastifyRequest) {
    this._log("pep_auth_start", {
      log_made_by: "auth-api",
      user: null,
      sessionid: "",
      event_description: "attempting auth",
      ...this._add_request_fields(request),
    });
  }
}
