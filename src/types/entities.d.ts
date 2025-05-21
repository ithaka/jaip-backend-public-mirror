import type { Group } from "./groups";
import type { UngroupedFeatureDetails } from "./features";

export enum EntityType {
  users = "users",
  facilities = "facilities",
}

export interface User {
  id?: number;
  name: string;
  type: string | null;
  ungrouped_features: UngroupedFeatureDetails;
  // This value is only used when adding or editing users
  contact?: string;
  groups: Array<Group>;
  uuid?: UUID;
  subdomain?: string;
  primary_sitecode?: string;
}

export interface Entity {
  id?: number;
  name?: string;
  // This is the only necessary value when adding or editing
  type: EntityType;
  ungrouped_features?: UngroupedFeatureDetails;
  // This value is only used when adding or editing
  contact?: string;
  groups?: Array<Group>;
  subdomain?: string;
  primary_sitecode?: string;
}

export interface EntityResponse {
  total: number;
  entities: { [key: string]: Entity };
}
