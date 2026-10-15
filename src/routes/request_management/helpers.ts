import { FEATURES } from "../../consts/index.js";
import { Entity, User } from "../../types/entities.js";
import { get_groups_with_any_features_enabled } from "../../utils/index.js";

export const valid_request_permission_dates = (
  start_date: string,
  end_date?: string | null,
): boolean => {
  const start = new Date(start_date);
  const end = end_date ? new Date(end_date) : null;

  if (
    Number.isNaN(start.getTime()) ||
    (end && Number.isNaN(end.getTime())) ||
    (end && end < start)
  ) {
    return false;
  }

  return true;
};

// Facilities belong to exactly one group.
const get_manageable_facilities = (user: User): Entity[] => {
  // Get the groups that the user has either manage_facilities or edit_facilities enabled for.
  const groups = get_groups_with_any_features_enabled(user, [
    FEATURES.manage_facilities,
    FEATURES.edit_facilities,
  ]);
  return (
    user.facilities?.filter((facility) =>
      // Check if the facility's group is in the list of groups that the user has permission to manage.
      // Facilities belong to exactly one group, so we can just check the first group in the array.
      groups.includes(facility.groups?.[0]?.id ?? -1),
    ) || []
  );
};

export const can_manage_facility = (
  user: User,
  facility_id: number,
): boolean => {
  const manageable_facilities = get_manageable_facilities(user);
  return manageable_facilities.some((facility) => facility.id === facility_id);
};
