import { User } from "../types/entities";

// NOTE: This function will return true if the user is associated with any
// group that has the feature enabled.
export const user_has_feature = (user: User, feature: string): boolean => {
  for (const group of user.groups) {
    if (group.features[feature]) {
      return true;
    }
  }
  return false;
};

export const user_has_feature_in_all_groups = (
  user: User,
  feature: string,
): boolean => {
  for (const group of user.groups) {
    if (!group.features[feature]) {
      return false;
    }
  }
  if (user.groups.length === 0 || !user.groups) {
    return false;
  }
  return true;
};

export const user_has_ungrouped_feature = (
  user: User,
  feature: string,
): boolean => {
  return (
    !!user.ungrouped_features[feature] &&
    !!user.ungrouped_features[feature].enabled
  );
};

// Sometimes it's useful to know not just if a user has a feature, but which groups
// have that feature enabled.
export const get_groups_with_feature_enabled = (
  user: User,
  feature: string,
): number[] => {
  const groups: number[] = [];
  for (const group of user.groups) {
    if (group.features[feature]) {
      groups.push(group.id);
    }
  }
  return groups;
};

export const get_groups_with_any_features_enabled = (
  user: User,
  features: string[],
): number[] => {
  const groups: number[] = [];
  for (const group of user.groups) {
    for (const feature of features) {
      if (group.features[feature]) {
        groups.push(group.id);
        // Once we find any of the features enabled in a group, we can move to the next group
        break;
      }
    }
  }
  return groups;
};
