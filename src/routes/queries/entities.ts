import { Prisma, user_roles } from "@prisma/client";
import { DBEntity } from "../../types/database";
import { User } from "../../types/entities";
import { Group } from "../../types/groups";
import { UngroupedFeatureDetails } from "../../types/features";

export const get_facility_query = (
  arr: string[],
): Prisma.facilitiesFindFirstArgs => ({
  where: {
    jstor_id: {
      in: arr,
    },
  },
  select: get_entity_select_clause(user_roles.user),
});

export const get_user_query = (arr: string[]): Prisma.usersFindFirstArgs => ({
  where: {
    jstor_id: {
      in: arr,
    },
  },
  select: get_entity_select_clause(user_roles.admin),
});

export const get_entity_select_clause = (
  role: user_roles,
): Prisma.usersSelect => ({
  jstor_id: true,
  entities: {
    select: {
      name: true,
      id: true,
      entity_type: true,
      groups_entities: {
        select: {
          groups: {
            select: {
              id: true,
              name: true,
            },
          },
          role: true,
        },
        where: {
          role: {
            equals: role,
          },
        },
      },
      features_groups_entities: {
        select: {
          enabled: true,
          features: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
          groups: {
            select: {
              id: true,
            },
          },
        },
      },
      ungrouped_features_entities: {
        select: {
          enabled: true,
          ungrouped_features: true,
        },
        where: {
          enabled: true,
          ungrouped_features: {
            is_active: true,
          },
        },
      },
    },
  },
});

export const get_many_entities_select_clause = (
  role: user_roles,
  groups: number[],
): Prisma.usersSelect => ({
  jstor_id: true,
  entities: {
    select: {
      name: true,
      id: true,
      entity_type: true,
      groups_entities: {
        select: {
          groups: {
            select: {
              id: true,
              name: true,
            },
          },
          role: true,
        },
        where: {
          role: {
            equals: role,
          },
          group_id: {
            in: groups,
          },
        },
      },
      features_groups_entities: {
        select: {
          enabled: true,
          features: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
          groups: {
            select: {
              id: true,
            },
          },
        },
        where: {
          group_id: {
            in: groups,
          },
        },
      },
      ungrouped_features_entities: {
        select: {
          enabled: true,
          ungrouped_features: true,
        },
        where: {
          ungrouped_features: {
            is_active: true,
          },
        },
      },
    },
  },
});

export const map_entities = (user: DBEntity): User => {
  const entity = {
    id: user.entities.id,
    name: user.entities.name,
    contact: user.jstor_id,
    type: user.entities.entity_type,
    uuid: user.uuid,
    ungrouped_features:
      user.entities.ungrouped_features_entities?.reduce((acc, curr) => {
        if (curr.enabled && curr.ungrouped_features.is_active) {
          acc[curr.ungrouped_features.name] = {
            ...curr.ungrouped_features,
            enabled: curr.enabled,
          };
        }
        return acc;
      }, {} as UngroupedFeatureDetails) || ({} as UngroupedFeatureDetails),
    groups:
      user.entities.groups_entities?.reduce((groups, group) => {
        if (
          !group.groups?.id ||
          groups.some(
            (existing_group) => existing_group.id === group.groups?.id,
          )
        )
          return groups;
        groups.push({
          id: group.groups?.id,
          name: group.groups?.name,
          role: group.role,
          features:
            user.entities.features_groups_entities
              ?.filter((feature) => feature.groups.id === group.groups?.id)
              .reduce(
                (acc, curr) => {
                  if (curr.features.is_active) {
                    acc[curr.features.name] = !!curr.enabled;
                  }
                  return acc;
                },
                {} as Record<string, boolean>,
              ) || ({} as Record<string, boolean>),
        });
        return groups;
      }, [] as Array<Group>) || ([] as Array<Group>),
  };
  return entity;
};
