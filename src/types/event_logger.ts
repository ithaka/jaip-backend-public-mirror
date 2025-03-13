import { FastifyReply, FastifyRequest } from "fastify";
import { User } from "./entities";
import { Group } from "./groups";
import { Search3Request, SearchRequest } from "./search";
import { CedarIdentityBlock, CedarItemView, EntitlementMap } from "./routes";

export interface CaptainsLog {
  origin: string;
  eventtype: string;
  dests: string[];
  requestid: string;
  eventid: string;
  tstamp_usec: Date;
  delivered_by: string;
}

export interface CompleteLogPayload {
  log_made_by: string;
  event_description: string;
  user: User;
  sessionid: string;
  subdomain: string;
  db_subdomain: string;
  alert_text: string;
  alert_status: string;
  doi: string;
  item_doi: string;
  dois: string[];
  comments: string;
  reason: string;
  groups: number[];
  full_groups: Group[];
  group: Group;
  group_id: number;
  group_ids: number[];
  disciplines: string[];
  journals: string[];
  query: string;
  pageNo: number;
  limit: number;
  sort: string;
  filters: string[];
  facets: string[];
  fields: string[];
  search_request: SearchRequest;
  search3_request: Search3Request;
  entitlement_mapping: EntitlementMap;
  iid: string;
  item_id: string;
  cedar_identity_block: CedarIdentityBlock;
  cedar_item_view: CedarItemView[];
  stable_url: string;
  page: string;
  page_index: number;
  referer: string;
  page_path: string;
}
// The log payload in use will probably always be incomplete. Rather than
// specifying optional fields for everything or always specifying a Partial
// type, we'll just use this type alias to simplify things.
export type LogPayload = Partial<CompleteLogPayload>;

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
  pep_bad_request_error: (
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) => void;

  // GENERAL LOGGING
  pep_standard_log_start: (
    type: string,
    request: FastifyRequest,
    payload: LogPayload,
  ) => void;
  pep_standard_log_complete: (
    type: string,
    request: FastifyRequest,
    reply: FastifyReply,
    payload: LogPayload,
  ) => void;
}
