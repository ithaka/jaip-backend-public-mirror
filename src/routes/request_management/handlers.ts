import { ensure_error } from "../../utils/index.js";
import { LogPayload } from "../../event_handler/index.js";
import { valid_request_permission_dates } from "./helpers.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type {
  AddRequestPermissionsRequest,
  DeleteRequestPermissionsRequest,
  EditRequestPermissionsRequest,
} from "../../types/routes.js";
import { can_manage_facility } from "./helpers.js";

const FORBIDDEN_MESSAGE = "User does not have permission edit this facility";

export const add_request_permissions_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const { facility_id, start_date, end_date } =
      request.body as AddRequestPermissionsRequest;
    const log_payload: LogPayload = {
      log_made_by: "request-management-api",
      facility_id,
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_add_request_permissions_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to add request permission",
      },
    );

    try {
      const has_valid_dates = valid_request_permission_dates(
        start_date,
        end_date,
      );
      if (!has_valid_dates) {
        reply.code(400).send("invalid request permission date range");
        fastify.event_logger.pep_bad_request_error(request, reply, {
          ...log_payload,
          event_description: "invalid request permission date range",
        });
        return;
      }

      const can_manage = can_manage_facility(request.user, facility_id);
      if (!can_manage) {
        reply.code(403).send(FORBIDDEN_MESSAGE);
        fastify.event_logger.pep_forbidden_error(request, reply, {
          ...log_payload,
        });
        return;
      }

      const [permission, error] = await fastify.db.create_request_permission({
        data: {
          facility_id,
          admin_id: request.user.id!,
          start_date: new Date(start_date),
          end_date: end_date ? new Date(end_date) : null,
        },
      });

      if (error) {
        throw error;
      }

      reply.send(permission);

      fastify.event_logger.pep_standard_log_complete(
        "pep_add_request_permissions_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `added request permission ${permission.id} for facility ${facility_id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to add request permission",
        },
        "request-management",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const delete_request_permissions_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const { facility_id } = request.body as DeleteRequestPermissionsRequest;
    const log_payload: LogPayload = {
      log_made_by: "request-management-api",
      facility_id,
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_delete_request_permissions_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to delete request permission",
      },
    );

    try {
      const can_manage = can_manage_facility(request.user, facility_id);
      if (!can_manage) {
        reply.code(403).send(FORBIDDEN_MESSAGE);
        fastify.event_logger.pep_forbidden_error(request, reply, {
          ...log_payload,
        });
        return;
      }
      const error = await fastify.db.remove_request_permission(facility_id);
      if (error) {
        throw error;
      }

      reply.code(204).send();
      fastify.event_logger.pep_standard_log_complete(
        "pep_delete_request_permissions_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `deleted request permission for facility ${facility_id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to delete request permission",
        },
        "request-management",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const edit_request_permissions_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const { facility_id, start_date, end_date } =
      request.body as EditRequestPermissionsRequest;
    const log_payload: LogPayload = {
      log_made_by: "request-management-api",
      facility_id,
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_edit_request_permissions_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to edit request permission",
      },
    );

    try {
      const has_valid_dates = valid_request_permission_dates(
        start_date,
        end_date,
      );
      if (!has_valid_dates) {
        reply.code(400).send("invalid request permission date range");
        fastify.event_logger.pep_bad_request_error(request, reply, {
          ...log_payload,
          event_description: "invalid request permission date range",
        });
        return;
      }

      const can_manage = can_manage_facility(request.user, facility_id);
      if (!can_manage) {
        reply.code(403).send(FORBIDDEN_MESSAGE);
        fastify.event_logger.pep_forbidden_error(request, reply, {
          ...log_payload,
        });
        return;
      }

      const [permission, error] = await fastify.db.update_request_permission({
        where: { facility_id },
        data: {
          admin_id: request.user.id!,
          start_date: new Date(start_date),
          end_date: end_date ? new Date(end_date) : null,
          updated_at: new Date(),
        },
      });
      if (error) {
        throw error;
      }

      reply.send(permission);

      fastify.event_logger.pep_standard_log_complete(
        "pep_edit_request_permissions_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `edited request permission ${permission.id} for facility ${facility_id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to edit request permission",
        },
        "request-management",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
