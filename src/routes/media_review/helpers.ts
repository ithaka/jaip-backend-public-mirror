import { RequestPermission } from "../../types/entities.js";

/**
 * Check if a facility has a request permissions state that allows them to
 *  make requests.
 *
 * @param request_permissions The request permissions of the user, which includes a start date and an optional end date.
 * @returns True if the user can make requests, false otherwise.
 */
export const can_make_requests = (
  request_permissions: RequestPermission | null | undefined,
) => {
  // If no explicit request permissions are set, assume the facility can make requests.
  if (!request_permissions) {
    return true;
  }
  // If the start date is in the future, the facility can still make requests.
  if (request_permissions.start_date > new Date()) {
    return true;
  }
  // If the end date is null, and the start date is in the past (as it must be at this point),
  // the facility cannot make requests.
  if (request_permissions.end_date === null) {
    return false;
  }
  // If the end date exists and is in the future, the facility cannot submit requests.
  if (
    request_permissions.end_date &&
    request_permissions.end_date >= new Date()
  ) {
    return false;
  }
  return true;
};
