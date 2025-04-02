import { ensure_error } from "../../../utils";
import { LogPayload } from "../../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  GetPaginatedBody,
  IdOnlyBody,
  NameAndIdBody,
  NameOnlyBody,
} from "../../../types/routes";
import { Prisma, user_roles } from "@prisma/client";

export const get_groups_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<GetPaginatedBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_groups_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get groups",
      },
    );

    const { name, page, limit, is_active } = request.body;

    try {
      const where_clause: Prisma.groupsFindManyArgs = {
        where: {
          name: {
            contains: name,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      };
      if (is_active) {
        where_clause!.where!.is_active = is_active;
      }

      const [groups, count] = await fastify.prisma.$transaction([
        fastify.prisma.groups.findMany({
          ...where_clause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            name: "asc",
          },
        }),
        // Because we're not using a select, we can just recast the type
        fastify.prisma.groups.count({
          ...(where_clause as Prisma.groupsCountArgs),
        }),
      ]);
      if (!groups) {
        throw new Error("Groups not found");
      }
      if (!count) {
        throw new Error("Count not found");
      }

      reply.send({
        groups,
        total: count,
      });
      fastify.event_logger.pep_standard_log_complete(
        "pep_get_groups_complete",
        request,
        reply,
        {
          db_groups: groups,
          total: count,
          ...log_payload,
          event_description: "returning groups from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get groups",
        },
        "groups",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const add_group_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<NameOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_add_group_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to add group",
      },
    );
    const { name } = request.body;
    log_payload.group_name = name;

    try {
      const group = await fastify.prisma.groups.create({
        data: {
          name: name,
        },
      });

      reply.send(group);

      fastify.event_logger.pep_standard_log_complete(
        "pep_add_group_complete",
        request,
        reply,
        {
          db_groups: [group],
          ...log_payload,
          event_description: `successfully added subdomain to db: ${group.name}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      // This specific error can be handled separately.
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner.
        // This indicates a unique constraint violation.
        if (error.code === "P2002") {
          reply.send({ duplicate: true });
        }
        fastify.event_logger.pep_standard_log_complete(
          "pep_add_group_complete",
          request,
          reply,
          {
            is_duplicate: true,
            ...log_payload,
            event_description: "attempted to add duplicate group",
          },
        );
        return;
      }

      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to add group",
        },
        "groups",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const delete_group_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_delete_group_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to delete group",
      },
    );
    const { id } = request.body;
    log_payload.group_id = id;

    try {
      await fastify.prisma.$transaction([
        // We need to set the role to removed for any facilities or users associated with the group.
        fastify.prisma.groups_entities.updateMany({
          where: {
            group_id: id,
          },
          data: {
            role: user_roles.removed,
            updated_at: new Date(),
          },
        }),
        // Then we can set enabled to false for all the features_groups_entities associated with the group.
        fastify.prisma.features_groups_entities.updateMany({
          where: {
            group_id: id,
          },
          data: {
            enabled: false,
            updated_at: new Date(),
          },
        }),
        // Finally, we can set the group to inactive.
        fastify.prisma.groups.update({
          where: {
            id: id,
          },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        }),
      ]);

      fastify.event_logger.pep_standard_log_complete(
        "pep_delete_group_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `deleted group from db: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to delete group",
        },
        "groups",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const reactivate_group_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_reactivate_group_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to reactivate group",
      },
    );
    const { id } = request.body;
    log_payload.group_id = id;

    try {
      const group = await fastify.prisma.groups.update({
        where: {
          id: id,
        },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
      });

      reply.send(group);
      fastify.event_logger.pep_standard_log_complete(
        "pep_reactivate_group_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `reactivated group: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to reactivate group",
        },
        "groups",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const edit_group_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<NameAndIdBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_edit_group_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to edit group",
      },
    );
    const { id, name } = request.body;
    const new_name = name.trim();

    if (!new_name) {
      reply.code(400).send("Name cannot be empty");
      fastify.event_logger.pep_bad_request_error(request, reply, {
        ...log_payload,
        event_description: "Group name cannot be empty",
      });
      return;
    }
    log_payload.group_name = new_name;

    try {
      const group = await fastify.prisma.groups.update({
        where: {
          id: id,
        },
        data: {
          name: new_name,
          updated_at: new Date(),
        },
      });

      reply.send(group);
      fastify.event_logger.pep_standard_log_complete(
        "pep_edit_group_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `edited group: ${id}, ${name}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to edit group",
        },
        "groups",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const clear_history_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_clear_history_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to clear media review history",
      },
    );
    const { id } = request.body;
    log_payload.group_id = id;

    try {
      await fastify.prisma.statuses.deleteMany({
        where: {
          group_id: id,
        },
      });

      fastify.event_logger.pep_standard_log_complete(
        "pep_clear_history_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `cleared history from db for group: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to clear history",
        },
        "groups",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const create_group_admin_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_create_group_admin_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to create group admin",
      },
    );
    const { id } = request.body;
    log_payload.user_ids = [id];

    try {
      await fastify.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`CALL add_admin_to_active_groups(${id}::INT)`;
      });

      fastify.event_logger.pep_standard_log_complete(
        "pep_create_group_admin_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `added user as group admin: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to create group admin",
        },
        "groups",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
