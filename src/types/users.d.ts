import { FeatureDetails } from "./features";
import { Group } from "./groups";

export interface User {
  name: string;
  contact?: string;
  id: number;
  type: string;
  ungrouped_features: { [key: string]: FeatureDetails };
  groups: Group[];
  subdomain?: string;
  primary_sitecode?: string;
  invalid_email?: string;
}
