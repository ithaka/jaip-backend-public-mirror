import type { v4 as uuidv4 } from "uuid";

export interface AuthenticatedProfile {
  userId: uuidv4;
  institutionId: uuidv4;
  role: string[];
  accountType: string;
  accountCode: string;
  accountName: string;
}
