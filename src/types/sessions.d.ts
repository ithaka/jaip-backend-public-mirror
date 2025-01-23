import type { v4 as uuidv4 } from "@types/uuid";
import type {
  JPASS,
  Account,
  AuthenticatedAccount,
  AuthenticatedProfile,
  Entitlement,
} from "./accounts";
export interface Session {
  uuid: uuidv4;
  sessionId: string;
  previousSessionId: string;
  requestId: string;
  ip: string;
  userAgentString: string;
  termsConditionsAccepted: Boolean;
  lastAccessTime: Date;
  lastUpdatedTime: Date;
  startedTime: Date;
  validUntil: Date;
  lastEvaluation: Date;
  authenticated: Boolean;
  jpass: JPASS;
  attributes: string;
  reasonsForAccessByIdentity: string;
  authenticatedAccounts: AuthenticatedAccount[];
  userAccount: AuthenticatedAccount;
  accounts: Account[];
  relatedAccounts: Account[];
  implicitAccounts: Account[];
  authenticatedProfiles: AuthenticatedProfile[];
  entitlements: Entitlement[];
  licenses: License[];
  providerDesignationStatements: ProviderDesignationStatement[];
  licensedProducts: LicensedProduct[];
  accountEmailVerified: string;
}

export interface ProviderDesignationStatement {
  institutionId: uuidv4;
  statement: string;
  data: string;
}

export interface LicensedProduct {
  product: string;
  entitlementId: string;
  accounts: uuidv4[];
}
