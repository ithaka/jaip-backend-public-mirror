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
