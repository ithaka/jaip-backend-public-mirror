import { DBEntity } from "../types/database";
import { User } from "../types/entities";
import { UngroupedFeatureDetails } from "../types/Features";
import { Group } from "../types/groups";

export const map_entities = (user: DBEntity): User => {
  return {
    id: user.entities.id,
    name: user.entities.name,
    email: user.jstor_id,
    type: user.entities.entity_type,
    ungrouped_features:
      user.entities.ungrouped_features_entities?.reduce((acc, curr) => {
        if (curr.ungrouped_features.is_active) {
          acc[curr.ungrouped_features.name] = curr.ungrouped_features;
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
};
