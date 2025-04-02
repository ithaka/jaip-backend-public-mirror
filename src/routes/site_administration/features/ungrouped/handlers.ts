import { ensure_error } from "../../../../utils";
import { LogPayload } from "../../../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  AddUngroupedFeatureBody,
  EditUngroupedFeatureBody,
  GetPaginatedBody,
  IdOnlyBody,
} from "../../../../types/routes";
import { Prisma } from "@prisma/client";
import { check_trimmed_strings } from "../../../../utils";

export const get_ungrouped_features_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<GetPaginatedBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_ungrouped_features_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get ungrouped features",
      },
    );

    const { name, page, limit, is_active } = request.body;

    const name_query = name ? name.trim() : "";

    try {
      const query: Prisma.ungrouped_featuresFindManyArgs = {
        where: {
          OR: [
            {
              name: {
                contains: name_query,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              description: {
                contains: name_query,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              display_name: {
                contains: name_query,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          display_name: "asc",
        },
      };

      // We need to add the is_active field only if it's true. If it's not, we want to
      // return all features, including inactive ones.
      if (is_active) {
        query.where!.is_active = is_active;
      }

      const [features, count] = await fastify.prisma.$transaction([
        fastify.prisma.ungrouped_features.findMany(query),
        // Because we're not using a select, we can just recast the type
        fastify.prisma.ungrouped_features.count({
          ...(query as Prisma.ungrouped_featuresCountArgs),
        }),
      ]);
      if (!features) {
        throw new Error("Features not found");
      }
      if (!count) {
        throw new Error("Count not found");
      }

      reply.send({
        features,
        total: count,
      });
      fastify.event_logger.pep_standard_log_complete(
        "pep_get_ungrouped_features_complete",
        request,
        reply,
        {
          features,
          total: count,
          ...log_payload,
          event_description: "returning ungrouped features from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get ungrouped features",
        },
        "ungrouped_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const add_ungrouped_feature_handler =
  (fastify: FastifyInstance) =>
  async (
    request: FastifyRequest<AddUngroupedFeatureBody>,
    reply: FastifyReply,
  ) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_add_ungrouped_feature_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to add ungrouped feature",
      },
    );
    const { name, display_name, category, description } = request.body;

    // Checking here to make sure none of the submitted strings are empty
    const empty_strings = check_trimmed_strings({
      name,
      display_name,
      category,
      description,
    });
    if (empty_strings.length) {
      reply
        .code(400)
        .send(
          `The following fields cannot be empty: ${empty_strings.join(", ")}`,
        );
      fastify.event_logger.pep_bad_request_error(request, reply, {
        ...log_payload,
        event_description: `Empty fields were submitted for new ungrouped feature: ${empty_strings}`,
      });
      return;
    }

    const new_feature = {
      name: name.trim(),
      display_name: display_name.trim(),
      category: category.trim(),
      description: description.trim(),
    };
    log_payload.feature = new_feature;

    try {
      const feature = await fastify.prisma.ungrouped_features.create({
        data: {
          ...new_feature,
        },
      });

      reply.send(feature);

      fastify.event_logger.pep_standard_log_complete(
        "pep_add_ungrouped_feature_complete",
        request,
        reply,
        {
          feature,
          ...log_payload,
          event_description: `successfully added feature to db: ${feature.name}`,
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
          "pep_add_ungrouped_feature_complete",
          request,
          reply,
          {
            is_duplicate: true,
            ...log_payload,
            event_description: "attempted to add duplicate ungrouped feature",
          },
        );
        return;
      }

      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to add ungrouped feature",
        },
        "ungrouped_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const delete_ungrouped_feature_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_delete_ungrouped_feature_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to delete ungrouped feature",
      },
    );
    const { id } = request.body;
    log_payload.feature_id = id;

    try {
      await fastify.prisma.$transaction([
        // We need to updated the records where this features is involved so that they
        // are no longer enabled.
        fastify.prisma.ungrouped_features_entities.updateMany({
          where: {
            feature_id: {
              equals: id,
            },
          },
          data: {
            enabled: false,
            updated_at: new Date(),
          },
        }),
        // Then we can set the feature to inactive
        fastify.prisma.ungrouped_features.update({
          where: {
            id,
          },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        }),
      ]);

      fastify.event_logger.pep_standard_log_complete(
        "pep_delete_ungrouped_feature_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `deleted ungrouped feature: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to delete ungrouped feature",
        },
        "ungrouped_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const reactivate_ungrouped_feature_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_reactivate_ungrouped_feature_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to reactivate ungrouped feature",
      },
    );
    const { id } = request.body;
    log_payload.feature_id = id;

    try {
      const feature = await fastify.prisma.ungrouped_features.update({
        where: {
          id: id,
        },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
      });

      reply.send(feature);
      fastify.event_logger.pep_standard_log_complete(
        "pep_reactivate_ungrouped_feature_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `reactivated ungrouped_feature: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to reactivate ungrouped feature",
        },
        "ungrouped_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const edit_ungrouped_feature_handler =
  (fastify: FastifyInstance) =>
  async (
    request: FastifyRequest<EditUngroupedFeatureBody>,
    reply: FastifyReply,
  ) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_edit_ungrouped_feature_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to edit ungrouped feature",
      },
    );

    const { id, name, display_name, category, description } = request.body;

    // Checking here to make sure none of the submitted strings are empty
    const empty_strings = check_trimmed_strings({
      name,
      display_name,
      category,
      description,
    });
    if (empty_strings.length) {
      reply
        .code(400)
        .send(
          `The following fields cannot be empty: ${empty_strings.join(", ")}`,
        );
      fastify.event_logger.pep_bad_request_error(request, reply, {
        ...log_payload,
        event_description: `Empty fields were submitted for new ungrouped feature: ${empty_strings}`,
      });
      return;
    }
    const new_feature = {
      name: name.trim(),
      display_name: display_name.trim(),
      category: category.trim(),
      description: description.trim(),
    };
    log_payload.feature = new_feature;

    try {
      const feature = await fastify.prisma.ungrouped_features.update({
        where: {
          id: id,
        },
        data: {
          ...new_feature,
          updated_at: new Date(),
        },
      });

      log_payload.feature = feature;
      reply.send(feature);
      fastify.event_logger.pep_standard_log_complete(
        "pep_edit_ungrouped_feature_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `edited ungrouped feature: ${id}, ${name}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to edit ungrouped feature",
        },
        "ungrouped_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
