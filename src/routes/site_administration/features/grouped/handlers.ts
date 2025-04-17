import { ensure_error } from "../../../../utils";
import { LogPayload } from "../../../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  AddGroupFeatureBody,
  EditGroupFeatureBody,
  GetPaginatedBody,
  GetPaginatedRequest,
  IdOnlyBody,
} from "../../../../types/routes";
import { Prisma } from "@prisma/client";
import { FEATURES, UNGROUPED_FEATURES } from "../../../../consts";
import { check_trimmed_strings } from "../../../../utils";

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

      // In order to get the correct features, we need to know if the user can access protected
      // features. This is allowed if either the user is able to access protected features in
      // some group or if the user has any feature management privileges. First we check for
      // use_protected_features.
      const user_has_group_feature = request.user.groups.some(
        (group) => group.features[FEATURES.use_protected_features],
      );
      // Then we check for ungrouped features. If the user has any of these, they can access
      // protected features.
      const user_has_ungrouped_feature =
        request.user.ungrouped_features[UNGROUPED_FEATURES.add_feature]
          ?.enabled ||
        request.user.ungrouped_features[UNGROUPED_FEATURES.edit_feature]
          ?.enabled ||
        request.user.ungrouped_features[UNGROUPED_FEATURES.delete_feature]
          ?.enabled;

      // If neither of these are true, we need to set the is_protected field to false.
      // Otherwise, it will be undefined, which will return all features.
      if (!user_has_group_feature && !user_has_ungrouped_feature) {
        // This is defined above, so we know it's there.
        where_clause.where!.is_protected = { equals: false };
      }

      // We need to add the is_active field only if it's true. If it's not, we want to
      // return all features, including inactive ones.
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

      const [features, count, error] =
        await fastify.db.get_grouped_features_and_count(
          where_clause as Prisma.featuresCountArgs,
          query,
        );
      if (error) {
        throw error;
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
  async (request: FastifyRequest<AddGroupFeatureBody>, reply: FastifyReply) => {
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
      const [feature, error] = await fastify.db.create_grouped_feature({
        data: new_feature,
      });
      if (error) {
        throw error;
      }

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
      const error = await fastify.db.remove_grouped_feature(id);
      if (error) {
        throw error;
      }

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
      const [feature, error] = await fastify.db.update_grouped_feature({
        where: {
          id: id,
        },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
      });
      if (error) {
        throw error;
      }

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
  async (
    request: FastifyRequest<EditGroupFeatureBody>,
    reply: FastifyReply,
  ) => {
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
      const [feature, error] = await fastify.db.update_grouped_feature({
        where: {
          id: id,
        },
        data: {
          ...new_feature,
          updated_at: new Date(),
        },
      });
      if (error) {
        throw error;
      }
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
