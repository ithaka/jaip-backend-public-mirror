export interface Group {
  id: number;
  name: string;
  role: string;
  facilities?: string[];
  features: { [key: string]: boolean };
}
