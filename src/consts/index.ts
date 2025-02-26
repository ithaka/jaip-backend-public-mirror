import type { EntityType } from "../types/entities";

export const ADMIN_SUBDOMAINS = ["pep-admin", "admin.pep"];
export const ENTITY_TYPES: { [key: string]: EntityType } = {
  USERS: "users" as EntityType.users,
  FACILITIES: "facilities" as EntityType.facilities,
};
