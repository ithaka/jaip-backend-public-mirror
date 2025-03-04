import { jstor_types, Prisma, status_options } from "@prisma/client";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import {
  MediaReviewApproval,
  MediaReviewBulk,
  MediaReviewBulUndo,
  MediaReviewDenial,
  MediaReviewRequest,
} from "../../types/routes";

export const denial_and_incomplete_handler = (
  fastify: FastifyInstance,
  status: status_options,
) => {
  const action = status === status_options.Denied ? "denial" : "incomplete";
  return async (
    request: FastifyRequest<MediaReviewDenial>,
    reply: FastifyReply,
  ) => {
    const log_payload: LogPayload = {
      log_made_by: "media-review-api",
    };
    fastify.eventLogger.pep_standard_log_start(
      `pep_media_${action}_start`,
      request,
      {
        ...log_payload,
        event_description: `attempting document ${action}`,
      },
    );
    try {
      const doi = request.body.doi;
      const full_groups = request.user.groups.filter((group) =>
        request.body.groups.includes(group.id),
      );
      const reason = request.body.reason;
      const comments = request.body.comments;
      log_payload.doi = doi;
      log_payload.full_groups = full_groups;
      log_payload.reason = reason;
      log_payload.comments = comments;

      const groups = full_groups.map((group) => group.id);

      const db_object = groups.map((group_id) => ({
        jstor_item_type: jstor_types.doi,
        jstor_item_id: doi,
        status: status,
        entity_id: request.user.id!,
        group_id: group_id,
      }));

      // NOTE: Prisma is limited in its ability to handle bulk inserts. The createMany methods
      // don't allow simultaneously creating related records. This means that we can't create
      // a status and a status_detail in the same function call. We'll have to use a transaction
      // to ensure that all records are created or none are.
      await fastify.prisma.$transaction(async (tx) => {
        const statuses = await tx.statuses.createManyAndReturn({
          data: db_object,
        });
        if (statuses.length) {
          const details = [
            ...statuses.map((status) => {
              return {
                status_id: status.id,
                detail: comments,
                type: "comments",
              };
            }),
            ...statuses.map((status) => {
              return {
                status_id: status.id,
                detail: reason,
                type: "reason",
              };
            }),
          ];
          await tx.status_details.createMany({
            data: details,
          });
        } else {
          throw new Error("Failed to create statuses");
        }
      });

      // This is somewhat unnecessary. The original version of this code in Go added the
      // requests individually and logged each success. Because of Prisma's CreateMany method,
      // we'll either have a success or a failure for the entire request. So once we know it's
      // a success, we'll log each request individually to keep our logs consistent.
      groups.forEach((group) => {
        log_payload.group = request.user.groups.find((g) => g.id === group);
        fastify.eventLogger.pep_standard_log_complete(
          `pep_media_${action}_successful`,
          request,
          reply,
          {
            ...log_payload,
            event_description: `completed request for doi: ${doi}`,
          },
        );
      });
      fastify.eventLogger.pep_standard_log_complete(
        `pep_media_${action}_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `completed ${action} for doi: ${doi} in groups ${groups.join(", ")}`,
        },
      );
      reply.code(201);
    } catch (err) {
      const error = ensure_error(err);
      fastify.eventLogger.pep_error(request, reply, {}, "request", error);
      reply.code(500).send(error.message);
    }
  };
};

export const approval_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<MediaReviewApproval>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "media-review-api",
    };
    fastify.eventLogger.pep_standard_log_start(
      "pep_media_approval_start",
      request,
      {
        ...log_payload,
        event_description: "attempting document approval",
      },
    );
    try {
      const doi = request.body.doi;
      const groups = request.body.groups;
      log_payload.doi = doi;
      log_payload.full_groups = request.user.groups.filter((group) =>
        groups.includes(group.id),
      );

      await fastify.prisma.statuses.createManyAndReturn({
        data: groups.map((group_id) => {
          return {
            jstor_item_type: jstor_types.doi,
            jstor_item_id: doi,
            status: status_options.Approved,
            entity_id: request.user.id!,
            group_id: group_id,
          };
        }),
      });

      // This is somewhat unnecessary. The original version of this code in Go added the
      // requests individually and logged each success. Because of Prisma's CreateMany method,
      // we'll either have a success or a failure for the entire request. So once we know it's
      // a success, we'll log each request individually to keep our logs consistent.
      groups.forEach((group) => {
        log_payload.group = request.user.groups.find((g) => g.id === group);
        fastify.eventLogger.pep_standard_log_complete(
          "pep_media_approval_successful",
          request,
          reply,
          {
            ...log_payload,
            event_description: `completed request for doi: ${doi}`,
          },
        );
      });
      fastify.eventLogger.pep_standard_log_complete(
        "pep_media_request_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `completed approval for doi: ${doi} in groups ${groups.join(", ")}`,
        },
      );
      reply.code(201);
    } catch (err) {
      const error = ensure_error(err);
      fastify.eventLogger.pep_error(request, reply, {}, "request", error);
      reply.code(500).send(error.message);
    }
  };

export const request_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<MediaReviewRequest>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "media-review-api",
    };
    fastify.eventLogger.pep_standard_log_start(
      "pep_media_request_start",
      request,
      {
        ...log_payload,
        event_description: "attempting request document approval",
      },
    );
    try {
      const dois = request.body.dois;
      const comments = (request.body.comments || "").trim();
      // Because requests come from facilities, we can assume that there is only one group
      const group_id = request.user.groups[0].id;
      log_payload.dois = dois;
      log_payload.comments = comments;
      log_payload.group_id = group_id;

      const db_object = dois.map((doi) => {
        const obj = {
          jstor_item_type: jstor_types.doi,
          jstor_item_id: doi,
          status: status_options.Pending,
          entity_id: request.user.id!,
          group_id: group_id,
        };
        return obj;
      });

      // NOTE: Prisma is limited in its ability to handle bulk inserts. The createMany methods
      // don't allow simultaneously creating related records. This means that we can't create
      // a status and a status_detail in the same function call. We'll have to use a transaction
      // to ensure that all records are created or none are.
      await fastify.prisma.$transaction(async (tx) => {
        const statuses = await tx.statuses.createManyAndReturn({
          data: db_object,
        });
        if (statuses.length) {
          if (comments !== "") {
            await tx.status_details.createMany({
              data: statuses.map((status) => {
                return {
                  status_id: status.id,
                  detail: comments,
                  type: "comments",
                };
              }),
            });
          }
        } else {
          throw new Error("Failed to create statuses");
        }
      });

      // This is somewhat unnecessary. The original version of this code in Go added the
      // requests individually and logged each success. Because of Prisma's CreateMany method,
      // we'll either have a success or a failure for the entire request. So once we know it's
      // a success, we'll log each request individually to keep our logs consistent.
      db_object.forEach((obj) => {
        log_payload.doi = obj.jstor_item_id;
        fastify.eventLogger.pep_standard_log_complete(
          "pep_media_request_successful",
          request,
          reply,
          {
            ...log_payload,
            event_description: `completed request for doi: ${obj.jstor_item_id}`,
          },
        );
      });
      fastify.eventLogger.pep_standard_log_complete(
        "pep_media_request_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `completed request for dois: ${dois.join(", ")}`,
        },
      );
      reply.code(201);
    } catch (err) {
      const error = ensure_error(err);
      fastify.eventLogger.pep_error(request, reply, {}, "request", error);
      reply.code(500).send(error.message);
    }
  };

export const bulk_approval_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<MediaReviewBulk>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "media-review-api",
    };
    fastify.eventLogger.pep_standard_log_start(
      "pep_media_bulk_start",
      request,
      {
        ...log_payload,
        event_description: "attempting document approval",
      },
    );
    try {
      const full_groups = request.user.groups.filter((group) =>
        request.body.groups.includes(group.id),
      );

      // Using an empty array to handle undefined values allows us to just check length
      const documents = request.body.documents || [];
      const journals = request.body.journals || [];
      const disciplines = request.body.disciplines || [];

      // If none of the arrays have any values, then there is no change to process.
      // This is a little too complicated for the standard validation schema, so it's
      // handled here.
      if (!documents.length && !journals.length && !disciplines.length) {
        const message =
          "bad request: documents, journals, or disciplines provided";
        reply.code(400).send(message);
        fastify.eventLogger.pep_bad_request_error(request, reply, {
          ...log_payload,
          event_description: message,
        });
        return;
      }

      log_payload.full_groups = full_groups;
      log_payload.dois = documents;
      log_payload.journals = journals;
      log_payload.disciplines = disciplines;

      const groups = full_groups.map((group) => group.id);

      const db_docs = groups.reduce((acc, group) => {
        for (const doi of documents) {
          acc.push({
            jstor_item_type: jstor_types.doi,
            jstor_item_id: doi,
            status: status_options.Approved,
            entity_id: request.user.id!,
            group_id: group,
          });
        }
        return acc;
      }, [] as Prisma.statusesCreateManyInput[]);

      const db_disciplines = groups.reduce((acc, group) => {
        for (const code of disciplines) {
          acc.push({
            jstor_item_type: jstor_types.discipline,
            jstor_item_id: code,
            status: status_options.Approved,
            entity_id: request.user.id!,
            group_id: group,
          });
        }
        return acc;
      }, [] as Prisma.statusesCreateManyInput[]);

      const db_journals = groups.reduce((acc, group) => {
        for (const headid of journals) {
          acc.push({
            jstor_item_type: jstor_types.headid,
            jstor_item_id: headid,
            status: status_options.Approved,
            entity_id: request.user.id!,
            group_id: group,
          });
        }
        return acc;
      }, [] as Prisma.statusesCreateManyInput[]);

      const db_inserts = [...db_docs, ...db_disciplines, ...db_journals];

      await fastify.prisma.statuses.createManyAndReturn({
        data: db_inserts,
      });

      // This is somewhat unnecessary. The original version of this code in Go added the
      // requests individually and logged each success. Because of Prisma's CreateMany method,
      // we'll either have a success or a failure for the entire request. So once we know it's
      // a success, we'll log each request individually to keep our logs consistent.
      db_inserts.forEach((insert) => {
        log_payload.group = request.user.groups.find(
          (g) => g.id === insert.group_id,
        );
        fastify.eventLogger.pep_standard_log_complete(
          "pep_media_approval_successful",
          request,
          reply,
          {
            ...log_payload,
            event_description: `completed request for doi`,
          },
        );
      });
      fastify.eventLogger.pep_standard_log_complete(
        "pep_media_bulk_complete",
        request,
        reply,
        {
          ...log_payload,
          // event_description: `completed approval for doi: ${doi} in groups ${groups.join(", ")}`,
        },
      );
      reply.code(201);
    } catch (err) {
      const error = ensure_error(err);
      fastify.eventLogger.pep_error(request, reply, {}, "request", error);
      reply.code(500).send(error.message);
    }
  };

export const bulk_undo_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<MediaReviewBulUndo>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "media-review-api",
    };
    fastify.eventLogger.pep_standard_log_start(
      "pep_media_bulk_start",
      request,
      {
        ...log_payload,
        event_description: "attempting document approval",
      },
    );
    try {
      const full_groups = request.user.groups.filter((group) =>
        request.body.groups.includes(group.id),
      );
      const code = request.body.code;

      log_payload.full_groups = full_groups;

      const groups = full_groups.map((group) => group.id);

      const db_inserts: Prisma.statusesCreateManyInput[] = [];
      await fastify.prisma.$transaction(async (tx) => {
        // It would be possible to do this in a single query by passing the existing item type in the
        // request. This approach places minimal trust in the request
        const existing_statuses = await tx.statuses.findMany({
          where: {
            jstor_item_id: code,
            group_id: {
              in: groups,
            },
          },
          select: {
            jstor_item_id: true,
            group_id: true,
            jstor_item_type: true,
            status: true,
          },
        });
        if (!existing_statuses.length) {
          throw new Error(
            "undo error: no existing statuses found for provided code in the provided groups",
          );
        }
        existing_statuses.forEach((status) => {
          db_inserts.push({
            jstor_item_type: status.jstor_item_type,
            jstor_item_id: code,
            status: status_options.Approved,
            entity_id: request.user.id!,
            group_id: status.group_id,
          });
        });
        await tx.statuses.createMany({
          data: db_inserts,
        });
      });

      // This is somewhat unnecessary. The original version of this code in Go added the
      // requests individually and logged each success. Because of Prisma's CreateMany method,
      // we'll either have a success or a failure for the entire request. So once we know it's
      // a success, we'll log each request individually to keep our logs consistent.
      db_inserts.forEach((insert) => {
        log_payload.group = request.user.groups.find(
          (g) => g.id === insert.group_id,
        );
        fastify.eventLogger.pep_standard_log_complete(
          "pep_media_bulk_undo_successful",
          request,
          reply,
          {
            ...log_payload,
            event_description: `successfully undid bulk approval for code: ${code} in group ${insert.group_id}`,
          },
        );
      });
      fastify.eventLogger.pep_standard_log_complete(
        "pep_media_bulk_undo_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `successfully undid bulk approval for: ${code} in groups ${groups.join(", ")}`,
        },
      );
      reply.code(201);
    } catch (err) {
      const error = ensure_error(err);
      fastify.eventLogger.pep_error(request, reply, {}, "request", error);
      reply.code(500).send(error.message);
    }
  };
