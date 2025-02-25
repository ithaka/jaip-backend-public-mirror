export interface DBEntity {
  jstor_id: string;
  entities: Entities;
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
