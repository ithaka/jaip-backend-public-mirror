import { ensure_error } from "../../../../utils";
import { LogPayload } from "../../../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  AddFeatureBody,
  EditFeatureBody,
  GetPaginatedBody,
  GetPaginatedRequest,
  IdOnlyBody,
} from "../../../../types/routes";
import { Prisma } from "@prisma/client";
import { FEATURES, UNGROUPED_FEATURES } from "../../../../consts";
import { check_trimmed_strings } from "../../../../utils/validation";

export const get_group_features_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<GetPaginatedBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_group_features_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get group features",
      },
    );
    // Because group features are also fetched without pagination,
    // we can't assume all the features are there. Instead, we need to
    // cast it as a Partial and handle cases where pagination properties
    // are missing.
    const body = request.body as Partial<GetPaginatedRequest>;
    const { name, page, limit, is_active } = body;

    // Since we're using this as a query, we want to make sure it's an empty
    // string, rather than undefined if it's not provided.
    const name_query = name ? name.trim() : "";

    try {
      const where_clause: Prisma.featuresFindManyArgs = {
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
      };

      const user_has_group_feature = request.user.groups.some(
        (group) => group.features[FEATURES.use_protected_features],
      );
      const user_has_ungrouped_feature =
        request.user.ungrouped_features[UNGROUPED_FEATURES.add_feature]
          ?.enabled ||
        request.user.ungrouped_features[UNGROUPED_FEATURES.edit_feature]
          ?.enabled ||
        request.user.ungrouped_features[UNGROUPED_FEATURES.delete_feature]
          ?.enabled;

      if (!user_has_group_feature && !user_has_ungrouped_feature) {
        // This is defined above, so we know it's there.
        where_clause.where!.is_protected = { equals: false };
      }

      if (is_active) {
        where_clause.where!.is_active = is_active;
      }

      const query = {
        ...where_clause,
      };

      if (page && limit) {
        query.skip = (page - 1) * limit;
        query.take = limit;
      }

      const [features, count] = await fastify.prisma.$transaction([
        fastify.prisma.features.findMany({
          orderBy: {
            display_name: "desc",
          },
          ...query,
        }),
        // Because we're not using a select, we can just recast the type
        fastify.prisma.features.count({
          ...(where_clause as Prisma.featuresCountArgs),
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
        "pep_get_group_features_complete",
        request,
        reply,
        {
          features,
          total: count,
          ...log_payload,
          event_description: "returning features from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get features",
        },
        "group_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const add_group_feature_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<AddFeatureBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_add_group_feature_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to add group feature",
      },
    );
    const {
      name,
      display_name,
      category,
      description,
      is_admin_only,
      is_protected,
    } = request.body;

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
        event_description: `Empty fields were submitted for new group feature: ${empty_strings}`,
      });
      return;
    }

    const new_feature = {
      name: name.trim(),
      display_name: display_name.trim(),
      category: category.trim(),
      description: description.trim(),
      is_admin_only,
      is_protected,
    };
    log_payload.feature = new_feature;

    try {
      const feature = await fastify.prisma.features.create({
        data: {
          ...new_feature,
        },
      });

      reply.send(feature);

      fastify.event_logger.pep_standard_log_complete(
        "pep_add_group_feature_complete",
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
          "pep_add_group_feature_complete",
          request,
          reply,
          {
            is_duplicate: true,
            ...log_payload,
            event_description: "attempted to add duplicate group feature",
          },
        );
        return;
      }

      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to add group feature",
        },
        "group_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const delete_group_feature_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_delete_group_feature_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to delete group feature",
      },
    );
    const { id } = request.body;
    log_payload.feature_id = id;

    try {
      await fastify.prisma.$transaction([
        // We need to delete the records where this subdomain is used in the subdomains_facilities table
        fastify.prisma.features_groups_entities.updateMany({
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
        // Then we can set the subdomain to inactive
        fastify.prisma.features.update({
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
        "pep_delete_group_feature_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `deleted group feature: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to delete group feature",
        },
        "group_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const reactivate_group_feature_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<IdOnlyBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_reactivate_group_feature_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to reactivate group feature",
      },
    );
    const { id } = request.body;
    log_payload.feature_id = id;

    try {
      const feature = await fastify.prisma.features.update({
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
        "pep_reactivate_group_feature_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `reactivated group_feature: ${id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to reactivate group_feature",
        },
        "group_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const edit_group_feature_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<EditFeatureBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "site-administration",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_edit_group_feature_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to edit group feature",
      },
    );

    const {
      id,
      name,
      display_name,
      category,
      description,
      is_admin_only,
      is_protected,
    } = request.body;

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
        event_description: `Empty fields were submitted for new group feature: ${empty_strings}`,
      });
      return;
    }
    const new_feature = {
      name: name.trim(),
      display_name: display_name.trim(),
      category: category.trim(),
      description: description.trim(),
      is_admin_only,
      is_protected,
    };
    log_payload.feature = new_feature;

    try {
      const feature = await fastify.prisma.features.update({
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
        "pep_edit_group_feature_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `edited group_feature: ${id}, ${name}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to edit group feature",
        },
        "group_features",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
