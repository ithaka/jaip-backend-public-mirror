import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { entity_types, user_roles } from "@prisma/client";
import {
  AddEntitiesBody,
  GetEntitiesBody,
  RemoveEntitiesBody,
} from "../../types/routes";
import {
  add_or_edit_entity,
  get_facilities,
  get_users,
  remove_facility,
  remove_user,
} from "./helpers";
import { FEATURES, UNGROUPED_FEATURES } from "../../consts";
import { User } from "../../types/entities";

export const get_entities_handler =
  (fastify: FastifyInstance, type: entity_types) =>
  async (request: FastifyRequest<GetEntitiesBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "account-management-api",
      entity_type: type,
    };

    fastify.event_logger.pep_standard_log_start(
      `pep_get_${type}_start`,
      request,
      {
        ...log_payload,
        event_description: `attempting to get ${type}`,
      },
    );

    const { query, page, groups, limit, include_ungrouped } = request.body;
    log_payload.query = query;
    log_payload.page = page.toString();
    log_payload.groups = groups;
    log_payload.limit = limit;

    // NOTE: The requirements for managing this are a little too complex for the standard requirements guard.
    // We sometimes need to check not only that the user has a given feature, but also that they have it for
    // every group they're requesting data for.
    const full_groups = request.user.groups.filter((group) => {
      const has_feature =
        type === entity_types.users
          ? group.features[FEATURES.get_users]
          : group.features[FEATURES.get_facilities];
      return groups.includes(group.id) && has_feature;
    });

    log_payload.full_groups = full_groups;

    const has_ungrouped_feature =
      type === entity_types.users
        ? request.user.ungrouped_features[
            UNGROUPED_FEATURES.manage_superusers
          ] ||
          request.user.ungrouped_features[
            UNGROUPED_FEATURES.create_group_admins
          ]
        : request.user.ungrouped_features[
            UNGROUPED_FEATURES.create_group_admins
          ];
    if (full_groups.length !== groups.length && !has_ungrouped_feature) {
      reply
        .code(403)
        .send("You do not have permission to access all requested groups");
      fastify.event_logger.pep_forbidden_error(request, reply, {
        ...log_payload,
        event_description: `failed to get ${type}`,
      });
      return;
    }

    const role =
      type === entity_types.users ? user_roles.admin : user_roles.user;
    log_payload.entity_role = role;

    try {
      const is_manager =
        !!request.user.ungrouped_features[UNGROUPED_FEATURES.manage_superusers]
          ?.enabled && type === entity_types.users;

      if (type === entity_types.users) {
        fastify.log.info(`Getting users ${query}`);
        const [response, user_query_error] = await get_users(
          fastify.db,
          query,
          page,
          groups,
          limit,
          include_ungrouped && is_manager,
        );
        if (user_query_error) throw user_query_error;
        if (!response) throw new Error("failed to get users");
        const { total, entities } = response;
        log_payload.total = total;
        log_payload.entities = entities;
        log_payload.user_ids = Object.keys(entities).map(
          (id) => entities[id].id!,
        );
        reply.send({
          total,
          entities,
        });
      } else {
        fastify.log.info(`Getting facilities ${query}`);
        const [response, facility_query_error] = await get_facilities(
          fastify.db,
          query,
          page,
          groups,
          limit,
        );
        if (facility_query_error) throw facility_query_error;
        if (!response) throw new Error("failed to get facilities");
        const { total, entities } = response;
        log_payload.total = total;
        log_payload.entities = entities;
        log_payload.user_ids = Object.keys(entities).map(
          (id) => entities[id].id!,
        );
        reply.send({
          total,
          entities,
        });
      }

      fastify.event_logger.pep_standard_log_complete(
        `pep_get_${type}_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `returning ${type} from db`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: `failed to get ${type}`,
        },
        "account-management",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const remove_entities_handler =
  (fastify: FastifyInstance, type: entity_types) =>
  async (request: FastifyRequest<RemoveEntitiesBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "account-management-api",
      entity_type: type,
    };
    fastify.event_logger.pep_standard_log_start(
      `pep_remove_${type}_start`,
      request,
      {
        ...log_payload,
        event_description: `attempting to remove ${type}`,
      },
    );

    const altered_user = request.body;
    log_payload.altered_user = altered_user;
    const groups = altered_user.groups.map((group) => group.id);
    log_payload.groups = groups;

    // NOTE: The requirements for managing this are a little too complex for the standard requirements guard.
    // We sometimes need to check not only that the user has a given feature, but also that they have it for
    // every group they're requesting data for.
    const full_groups = request.user.groups.filter((group) => {
      const has_feature =
        type === entity_types.users
          ? group.features[FEATURES.remove_users]
          : group.features[FEATURES.manage_facilities];
      return groups.includes(group.id) && has_feature;
    });
    log_payload.full_groups = full_groups;

    if (full_groups.length != groups.length) {
      reply
        .code(403)
        .send("You do not have permission to access all requested groups");
      fastify.event_logger.pep_forbidden_error(request, reply, {
        ...log_payload,
        event_description: `failed to get ${type}`,
      });
      return;
    }

    try {
      if (type === entity_types.users) {
        fastify.log.info(`Removing user ${altered_user.id}`);
        const user_remove_error = await remove_user(
          fastify.db,
          altered_user.id,
          altered_user.groups,
        );
        if (user_remove_error) throw user_remove_error;
      } else {
        fastify.log.info(`Removing facility ${altered_user.id}`);
        const facility_remove_error = await remove_facility(
          fastify.db,
          altered_user.id,
          altered_user.groups,
        );
        if (facility_remove_error) throw facility_remove_error;
      }

      fastify.event_logger.pep_standard_log_complete(
        `pep_remove_${type}_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `removed ${type} from db`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: `failed to remove ${type}`,
        },
        "account-management",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const add_or_edit_entities_handler =
  (fastify: FastifyInstance, type: entity_types) =>
  async (request: FastifyRequest<AddEntitiesBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "account-management-api",
      entity_type: type,
    };
    fastify.event_logger.pep_standard_log_start(
      `pep_add_${type}_start`,
      request,
      {
        ...log_payload,
        event_description: `attempting to add ${type}`,
      },
    );

    const requested_user = request.body;
    const new_user: User = {
      ...requested_user,
      type,
      ungrouped_features: requested_user.ungrouped_features || {},
    };

    log_payload.altered_user = new_user;
    const groups = new_user.groups.map((group) => group.id);
    log_payload.groups = groups;

    // NOTE: The requirements for managing this are a little too complex for the standard requirements guard.
    // We sometimes need to check not only that the user has a given feature, but also that they have it for
    // every group they're requesting data for.
    const full_groups = request.user.groups.filter((group) => {
      const has_feature =
        type === entity_types.users
          ? group.features[FEATURES.add_or_edit_users]
          : group.features[FEATURES.manage_facilities] ||
            group.features[FEATURES.edit_facilities];
      return groups.includes(group.id) && has_feature;
    });
    log_payload.full_groups = full_groups;

    const has_ungrouped_feature =
      type === entity_types.users &&
      request.user.ungrouped_features[UNGROUPED_FEATURES.manage_superusers]
        ?.enabled;

    if (full_groups.length !== groups.length && !has_ungrouped_feature) {
      reply
        .code(403)
        .send("You do not have permission to access all requested groups");
      fastify.event_logger.pep_forbidden_error(request, reply, {
        ...log_payload,
        event_description: `failed to get ${type}`,
      });
      return;
    }

    try {
      if (type === entity_types.users) {
        const is_manager =
          !!request.user.ungrouped_features[
            UNGROUPED_FEATURES.manage_superusers
          ]?.enabled;
        fastify.log.info(`Adding or editing user ${new_user.id}`);
        const add_user_error = await add_or_edit_entity(
          fastify.db,
          new_user,
          type,
          is_manager,
        );
        if (add_user_error) throw add_user_error;
      } else {
        if (full_groups.length != 1) {
          reply
            .code(400)
            .send("Facilities can only be added to one group at a time");
          fastify.event_logger.pep_bad_request_error(request, reply, {
            ...log_payload,
            event_description: `attempted to add ${type} without exactly one group: ${groups}`,
          });
        } else {
          const is_manager =
            full_groups.filter((group) => {
              return group.features[FEATURES.manage_facilities];
            }).length === full_groups.length;
          fastify.log.info(`Adding or editing facility ${new_user.id}`);
          const add_facility_error = await add_or_edit_entity(
            fastify.db,
            new_user,
            type,
            is_manager,
          );
          if (add_facility_error) {
            if (
              add_facility_error.message ===
              "User does not have permission to add facilities"
            ) {
              reply
                .code(403)
                .send("You do not have permission to add facilities");
              fastify.event_logger.pep_forbidden_error(request, reply, {
                ...log_payload,
                event_description: `failed to add ${type}`,
              });
            }
          }
        }
      }

      fastify.event_logger.pep_standard_log_complete(
        `pep_add_${type}_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `added ${type} from db`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: `failed to add ${type}`,
        },
        "account-management",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
