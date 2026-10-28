export interface Group {
  id: number;
  name: string;
  role: string;
  has_global_approval?: boolean;
  facilities?: string[];
  features: { [key: string]: boolean };
}
