import { StatusOptions } from "./media_record";

export interface IPBypassResult {
  facilities: {
    jstor_id: string;
  };
}

export interface DBEntity {
  id?: number;
  jstor_id: string;
  entities: Entities;
  uuid?: string;
  subdomains_facilities?: {
    sitecode: string;
    subdomain: string;
  }[];
}
export interface DBGroup {
  name: string;
  is_active: boolean;
  id: number;
  created_at: Date;
  updated_at: Date;
}

export enum UserRole {
  admin = "admin",
  user = "user",
  removed = "removed",
  null = null,
}
export interface Entities {
  name: string;
  id: number;
  entity_type: string | null;
  groups_entities?:
    | { role: user_roles | null; groups: { id: number; name: string } | null }[]
    | null;
  features_groups_entities?: {
    groups: { id: number };
    enabled: boolean | null;
    features: { id: number; name: string; is_active: boolean };
  }[];
  ungrouped_features_entities?: {
    enabled: boolean;
    ungrouped_features: {
      description: string;
      id: number;
      is_active: boolean;
      created_at: Date | null;
      updated_at: Date | null;
      name: string;
      display_name: string;
      category: string;
    };
  }[];
}

export interface GroupsOrFeatures {
  id: number;
  name: string;
}

export interface Groups {
  id: number;
}
export interface UngroupedFeaturesEntitiesEntity {
  ungrouped_features: UngroupedFeatures;
}
export interface UngroupedFeatures {
  id: number;
  name: string;
  display_name: string;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Status {
  jstor_item_id: string | null;
  jstor_item_type: jstor_types | null;
  status: status_options | StatusOptions | null;
  entity_id?: number | null;
  group_id?: number | null;
  created_at?: Date | null;
  entities?: {
    id: number;
    name: string;
  } | null;
  groups?: {
    id: number;
    name: string;
  } | null;
  status_details?:
    | {
        type: string | null;
        detail: string | null;
      }[]
    | null;
}
