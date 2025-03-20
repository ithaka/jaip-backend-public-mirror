import { ensure_error } from "../../../utils";
import { LogPayload } from "../../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  AddSubdomainBody,
  DeleteSubdomainBody,
  EditSubdomainBody,
  GetSubdomainsBody,
} from "../../../types/routes";
import { entity_types, Prisma } from "@prisma/client";

export const get_subdomains_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<GetSubdomainsBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "subdomains-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_subdomain_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get subdomains",
      },
    );
    const { name, page, limit, is_active } = request.body;

    try {
      const where_clause: Prisma.subdomainsFindManyArgs = {
        where: {
          subdomain: {
            contains: name,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      };
      if (is_active) {
        where_clause!.where!.is_active = is_active;
      }

      const [subdomains, count] = await fastify.prisma.$transaction([
        fastify.prisma.subdomains.findMany({
          ...where_clause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            subdomain: "desc",
          },
        }),
        // Because we're not using a select, we can just recast the type
        fastify.prisma.subdomains.count({
          ...(where_clause as Prisma.subdomainsCountArgs),
        }),
      ]);
      if (!subdomains) {
        throw new Error("Subdomains not found");
      }
      if (!count) {
        throw new Error("Count not found");
      }

      reply.send({
        subdomains,
        total: count,
      });
      fastify.event_logger.pep_standard_log_complete(
        "pep_add_subdomain_complete",
        request,
        reply,
        {
          db_subdomains: subdomains,
          total: count,
          ...log_payload,
          event_description: "returning subdomains from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get subdomains",
        },
        "subdomains",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const add_subdomain_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<AddSubdomainBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "subdomains-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_add_subdomain_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to add subdomain",
      },
    );
    const { name } = request.body;
    log_payload.db_subdomain = name;

    try {
      const subdomain = await fastify.prisma.subdomains.create({
        data: {
          subdomain: name,
          entity_type: entity_types.facilities,
          is_active: true,
        },
      });

      reply.send(subdomain);

      fastify.event_logger.pep_standard_log_complete(
        "pep_add_subdomain_complete",
        request,
        reply,
        {
          db_subdomains: [subdomain],
          ...log_payload,
          event_description: `successfully added subdomain to db: ${subdomain.subdomain}`,
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
          "pep_add_subdomain_complete",
          request,
          reply,
          {
            is_duplicate: true,
            ...log_payload,
            event_description: "attempted to add duplicate subdomain",
          },
        );
        return;
      }

      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to add subdomain",
        },
        "subdomains",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const delete_subdomain_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<DeleteSubdomainBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "subdomains-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_delete_subdomain_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to delete subdomains",
      },
    );
    const { id } = request.body;
    log_payload.db_subdomain_id = id;

    try {
      await fastify.prisma.$transaction([
        // We need to delete the records where this subdomain is used in the subdomains_facilities table
        fastify.prisma.subdomains_facilities.deleteMany({
          where: {
            subdomains: {
              id: id,
            },
          },
        }),
        // Then we can set the subdomain to inactive
        fastify.prisma.subdomains.update({
          where: {
            id,
          },
          data: {
            is_active: false,
          },
        }),
      ]);

      fastify.event_logger.pep_standard_log_complete(
        "pep_delete_subdomain_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: "returning subdomains from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get subdomains",
        },
        "subdomains",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const reactivate_subdomain_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<DeleteSubdomainBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "subdomains-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_reactivate_subdomain_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to reactivate subdomain",
      },
    );
    const { id } = request.body;
    log_payload.db_subdomain_id = id;

    try {
      const subdomain = await fastify.prisma.subdomains.update({
        where: {
          id: id,
        },
        data: {
          is_active: true,
        },
      });

      reply.send(subdomain);
      fastify.event_logger.pep_standard_log_complete(
        "pep_reactivate_subdomain_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `reactivated subdomain: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to reactivate subdomain",
        },
        "subdomains",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const edit_subdomain_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<EditSubdomainBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "subdomains-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_edit_subdomain_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to edit subdomain",
      },
    );
    const { id, name } = request.body;
    const new_name = name.trim().toLowerCase();
    if (!new_name) {
      reply.code(400).send("Name cannot be empty");
      fastify.event_logger.pep_bad_request_error(request, reply, {
        ...log_payload,
        event_description: "Subdomain name cannot be empty",
      });
      return;
    }
    log_payload.db_subdomain_id = id;
    log_payload.db_subdomain = name;

    try {
      const subdomain = await fastify.prisma.subdomains.update({
        where: {
          id: id,
        },
        data: {
          subdomain: new_name,
        },
      });

      reply.send(subdomain);
      fastify.event_logger.pep_standard_log_complete(
        "pep_edit_subdomain_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `edited subdomain: ${id}, ${name}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to edit subdomain",
        },
        "subdomains",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
