// NOTE: This function is expected to return a code and message in any case where
// is_valid is false. If is_valid is true, code and message may be omitted.
export const is_target_valid = (
  is_site_manager: boolean,
  subdomains: string[] | undefined,
  groups: number[] | undefined,
  facilities: number[] | undefined,
): { is_valid: boolean; code?: number; message?: string } => {
  const hasSubdomains = Array.isArray(subdomains) && subdomains.length > 0;
  const hasGroups = Array.isArray(groups) && groups.length > 0;
  const hasFacilities = Array.isArray(facilities) && facilities.length > 0;

  if (!hasSubdomains && !hasGroups && !hasFacilities) {
    return {
      is_valid: false,
      code: 400,
      message: "Alerts require at least one target",
    };
  } else if (!is_site_manager && !hasFacilities) {
    return {
      is_valid: false,
      code: 403,
      message:
        "Only ITHAKA site managers may send alerts to groups or subdomains",
    };
  }
  return { is_valid: true };
};
