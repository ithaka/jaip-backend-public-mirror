export interface Feature {
  id?: number;
  name: string;
  display_name: string;
  category?: string;
  description: string;
  is_admin_only?: boolean;
  is_protected?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
export interface CategorizedFeatures {
  [key: string]: Array<Feature>;
}
export interface FeatureObject {
  [key: string]: Feature;
}
export interface FeatureBoolean {
  [key: string]: boolean;
}

export interface FeatureDetails {
  [key: string]: {
    id: number;
    enabled: boolean;
    groups: number[];
    disabled_groups: number[];
  };
}

export interface UngroupedFeature {
  enabled?: boolean;
  description: string;
  category: string;
  display_name: string;
  name?: string;
  is_active?: boolean;
}
export interface UngroupedFeatureDetails {
  [key: string]: UngroupedFeature;
}

export interface FeatureRequest {
  name?: string;
  page?: number;
  limit?: number;
  is_active: boolean;
}
export interface FeatureResponse {
  total: number;
  features: Feature[];
}
