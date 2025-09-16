import { ensure_error } from "../../utils/index";
import { LogPayload } from "../../event_handler/index";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type {
  AddAlertBody,
  GetPaginatedGroupedBody,
  IdOnlyBody,
  EditAlertBody,
} from "../../types/routes.d.ts";
import { Prisma } from "@prisma/client";
import { FEATURES, UNGROUPED_FEATURES } from "../../consts/index";
import { is_target_valid } from "./helpers";

export const get_alerts_handler =
  (fastify: FastifyInstance) =>
  async (
    request: FastifyRequest<GetPaginatedGroupedBody>,
    reply: FastifyReply,
  ) => {
    const log_payload: LogPayload = {
      log_made_by: "alerts-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_alerts_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get alerts",
      },
    );

    log_payload.full_groups = request.user?.groups;

    try {
      // This is the default where clause when getting active alerts for display.
      const query: Prisma.targeted_alertsFindManyArgs = {
        where: {
          is_active: true,
          start_date: {
            lte: new Date(),
          },
          end_date: {
            gte: new Date(),
          },
          // We want to retrieve any active alerts that match any of the groups
          // facilities, or subdomains that the request is coming from.
          OR: [
            {
              alerts_groups: {
                // To view active alerts, the user need only have access to one of the
                // groups attached to the alert.
                some: { group_id: { in: request.user?.groups.map((g) => g.id)  || [] } },
              },
            },
            {
              alerts_facilities: {
                some: {
                  facility_id: {
                    in: request.user?.facilities?.map((f) => f.id!) || [],
                  },
                },
              },
            },
            {
              alerts_subdomains: {
                some: { subdomain: { equals: request.subdomain } },
              },
            },
          ],
        },
      };


      const [alerts, count, error] =
        await fastify.db.get_targeted_alerts_and_count(
          {
            ...(query as Prisma.targeted_alertsCountArgs),
          },
          {
            ...query,
            select: {
              id: true,
              text: true,
              status: true,
              is_active: true,
              start_date: true,
              end_date: true,
              created_at: true,
              updated_at: true,
            },
            orderBy: {
              created_at: "desc",
            },
          },
        );

      if (error) {
        throw error;
      }

      reply.send({
        alerts,
        total: count,
      });
      fastify.event_logger.pep_standard_log_complete(
        "pep_get_alerts_complete",
        request,
        reply,
        {
          alerts: alerts,
          total: count,
          ...log_payload,
          event_description: "returning alerts from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get alerts",
        },
        "alerts",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const get_paginated_alerts_handler =
  (fastify: FastifyInstance) =>
  async (
    request: FastifyRequest<GetPaginatedGroupedBody>,
    reply: FastifyReply,
  ) => {
    const log_payload: LogPayload = {
      log_made_by: "alerts-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_paginated_alerts_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get paginated alerts",
      },
    );

    const { name, page, limit, is_active, groups } = request.body;

    // NOTE: The requirements for managing this are a little too complex for the standard requirements guard.
    // We sometimes need to check not only that the user has a given feature, but also that they have it for
    // every group they're requesting data for.
    const full_groups = request.user.groups?.filter((group) => {
      const has_feature =
        group.features[FEATURES.edit_facilities] ||
        group.features[FEATURES.manage_facilities];
      return groups?.includes(group.id) && has_feature;
    });

    log_payload.full_groups = full_groups;

    try {
      // This is the default where clause when getting active alerts for display.
      const query: Prisma.targeted_alertsFindManyArgs = {
        where: {
          text: { contains: name, mode: Prisma.QueryMode.insensitive },
          // // We only want to retrieve active alerts. From the user perspective, a deleted alert is gone.
          is_active: true,

          alerts_groups: {
            // In order to allow edit access, the user must have edit access for
            // every group attached to the alert.
            every: { group_id: { in: full_groups.map((g) => g.id) } },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      };
      if (is_active) {
        query!.where!.start_date = {
          lte: new Date(),
        };
        query!.where!.end_date = {
          gte: new Date(),
        };
      }
      const select_clause = {
        select: {
          id: true,
          text: true,
          status: true,
          is_active: true,
          start_date: true,
          end_date: true,
          created_at: true,
          updated_at: true,
          alerts_subdomains: {
            select: {
              subdomain: true,
            },
          },
          alerts_groups: {
            select: {
              groups: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          alerts_facilities: {
            select: {
              facilities: {
                select: {
                  jstor_id: true,
                  entities: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }
  
      const [alerts, count, error] =
        await fastify.db.get_targeted_alerts_and_count(
          {
            ...(query as Prisma.targeted_alertsCountArgs),
          },
          {
            ...query,
            ...select_clause, 
          },
        );

      if (error) {
        throw error;
      }

      reply.send({
        alerts,
        total: count,
      });
      fastify.event_logger.pep_standard_log_complete(
        "pep_get_paginated_alerts_complete",
        request,
        reply,
        {
          alerts: alerts,
          total: count,
          ...log_payload,
          event_description: "returning paginated alerts from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get alerts",
        },
        "alerts",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const add_alert_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<AddAlertBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "alerts-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_add_alert_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to add alert",
      },
    );

    const {
      text,
      status,
      is_active,
      start_date,
      end_date,
      subdomains,
      groups,
      facilities,
    } = request.body;

    const { is_valid, code, message } = is_target_valid(
      !!request.user.ungrouped_features[UNGROUPED_FEATURES.add_subdomain]
        ?.enabled,
      subdomains,
      groups,
      facilities,
    );
    if (!is_valid) {
      reply.code(code!).send(message!);
      return;
    }

    try {
      const [alert, error] = await fastify.db.create_targeted_alert(
        {
          data: {
            text,
            status,
            is_active,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            entity_id: request.user.id!,
          },
        },
        subdomains || [],
        groups || [],
        facilities || [],
      );
      if (error) {
        throw error;
      }
      if (!alert) {
        throw new Error("Failed to create alert.");
      }

      reply.send({
        ...alert,
      });

      fastify.event_logger.pep_standard_log_complete(
        "pep_add_alert_complete",
        request,
        reply,
        {
          alerts: [alert],
          ...log_payload,
          event_description: `successfully added alert to db: ${alert.id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);

      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to add alert",
        },
        "alerts",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const delete_alert_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "alerts-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_delete_alert_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to delete alert",
      },
    );
    const { id } = request.body;
    log_payload.alert_id = id;

    try {
      await fastify.db.remove_targeted_alert(id);
      reply.code(204).send();
      fastify.event_logger.pep_standard_log_complete(
        "pep_delete_alert_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `deleted alert from db: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to delete alert",
        },
        "alerts",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const edit_alert_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<EditAlertBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "alerts-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_edit_alert_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to edit alert",
      },
    );
    const {
      id,
      text,
      status,
      is_active,
      start_date,
      end_date,
      subdomains,
      groups,
      facilities,
    } = request.body;

    const { is_valid, code, message } = is_target_valid(
      !!request.user.ungrouped_features[UNGROUPED_FEATURES.add_subdomain]
        ?.enabled,
      subdomains,
      groups,
      facilities,
    );
    if (!is_valid) {
      reply.code(code || 400).send(message || "Invalid alert target.");
      return;
    }

    try {
      const alert_update: Prisma.targeted_alertsUpdateArgs = {
        where: {
          id: id,
        },
        data: {
          text,
          status,
          is_active,
          start_date,
          end_date,
          entity_id: request.user.id!,
          updated_at: new Date(),
        },
      };
      const [alert, error] = await fastify.db.update_targeted_alert(
        alert_update,
        subdomains || [],
        groups || [],
        facilities || [],
      );
      if (error) {
        throw error;
      }

      reply.send({
        ...alert,
      });

      fastify.event_logger.pep_standard_log_complete(
        "pep_edit_alert_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `edited alert: ${id}, ${text}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);

      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to edit alert",
        },
        "alerts",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
