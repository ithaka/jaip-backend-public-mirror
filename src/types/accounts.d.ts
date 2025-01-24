import type { v4 as uuidv4 } from "@types/uuid";

export interface Account {
  id: uuidv4;
  internalId: string;
  legacyId: string;
  createTime: Date;
  name: string;
  contact: Contact;
  description: string;
  status: string;
  type: string;
  accountType: AccountType;
  credentials: AccountCredential[];
  roles: string[];
  licenses: License[];
  childIds: uuidv4[];
}

export interface IndividualAccount extends Account {
  emailVerified: Boolean;
  tcAcceptDate: Date;
  isAdminUser: Boolean;
  sharedSignon: Boolean;
}

export interface GroupAccount extends Account {
  code: string;
}

export interface InstitutionAccount extends Account {
  code: string;
  bannerId: string;
  activateCode: string;
}

export interface PublisherAccount extends Account {
  code: string;
  doi: string;
  categoryId: string;
}

export interface ConsortiumAccount extends Account {
  code: string;
  bannerId: string;
  activateCode: string;
}

export interface SocietyAccount extends Account {
  code: string;
  bannerId: string;
  activateCode: string;
}

export interface UserAgentAccount extends Account {
  code: string;
}

export interface WebCrawlerAccount extends Account {
  code: string;
}

export interface RegionAccount extends Account {
  code: string;
}

export interface AuthenticatedAccount extends Account {
  code: string;
  authenticatedCredentials: AccountCredential[];
  providerDesignationStatement: string;
}

export interface AuthenticatedIndividualAccount extends AuthenticatedAccount {
  emailVerified: Boolean;
  tcAcceptDate: Date;
  isAdminUser: Boolean;
  sharedSignon: Boolean;
}

export interface AuthenticatedGroupAccount extends AuthenticatedAccount {
  code: string;
}

export interface AuthenticatedInstitutionAccount extends AuthenticatedAccount {
  code: string;
  bannerId: string;
  activateCode: string;
}

export interface AuthenticatedPublisherAccount extends AuthenticatedAccount {
  code: string;
  doi: string;
  categoryId: string;
}

export interface AuthenticatedConsortiumAccount extends AuthenticatedAccount {
  code: string;
  bannerId: string;
  activateCode: string;
}

export interface AuthenticatedSocietyAccount extends AuthenticatedAccount {
  code: string;
  bannerId: string;
  activateCode: string;
}

export interface AuthenticatedUserAgentAccount extends AuthenticatedAccount {
  code: string;
}

export interface AuthenticatedWebCrawlerAccount extends AuthenticatedAccount {
  code: string;
}

export interface AuthenticatedRegionAccount extends AuthenticatedAccount {
  code: string;
}

export interface AccountType {
  id: number;
  value: string;
  description: string;
  legacyType: string;
}

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
}

export interface AccountCredential {
  id: string;
  type: AccountCredentialType;
  legacyId: string;
  accountExternalId: uuidv4;
  legacyUniqueValue: string;
}

export interface AccountCredentialUserPass extends AccountCredential {
  username: string;
  password: string;
  lastUpdateTime: Date;
  format: string;
}

export interface AccountCredentialIPRange extends AccountCredential {
  ipAddress: string;
  allow: Boolean;
}

export interface AccountCredentialShibboleth extends AccountCredential {
  entity: string;
}

export interface AccountCredentialShibbolethIndividual
  extends AccountCredential {}

export interface AccountCredentialReferrer extends AccountCredential {
  referrer: string;
}

export interface AccountCredentialPrebakedSession extends AccountCredential {
  mom: Boolean;
}

export interface AccountCredentialWebCrawler extends AccountCredential {
  ipAddress: string;
}

export interface AccountCredentialCasa extends AccountCredential {
  value: string;
}

export interface AccountCredentialBrowserPairing extends AccountCredential {
  uuidv4: string;
}

export interface AccountCredentialAccessPersist extends AccountCredential {
  username: string;
}

export interface AccountCredentialOAuth extends AccountCredential {
  oAuthUserId: string;
  oAuthProvider: string;
}

export interface AccountCredentialOAuthProvisional extends AccountCredential {}

export interface AccountCredentialJstorInstitutionIndividualPairing
  extends AccountCredential {
  individualId: string;
}

export interface AccountCredentialDomain extends AccountCredential {
  domain: string;
}

export interface AccountCredentialLti extends AccountCredential {
  deploymentId: string;
  appKey: string;
}

export interface AccountCredentialGeneric extends AccountCredential {}

export interface AccountCredentialAccountId extends AccountCredential {}

export interface AccountCredentialType {
  value: string;
  rank: number;
}

export interface Entitlement {
  entitlementId: string;
  licenses: License[];
  updateTime: Date;
}

export interface JPASS {
  active: Boolean;
  jpassDownloadCount: number;
}

export interface LicenseSubscription {
  id: uuidv4;
  legacyId: string;
  type: LicenseType;
  status: LicenseStatus;
  entitlement: LicenseEntitlement;
  term: LicenseTerm;
  description: string;
  account: LicenseAccount;
  createTime: Date;
  offer: Offer;
}

export interface Offer {
  id: string;
  code: string;
}

export interface LicenseAccount {
  id: uuidv4;
  internalId: string;
  legacyId: string;
  type: string;
}

export interface License extends LicenseSubscription {
  fullType: string;
  subType: string;
  tags: string[];
  updateTime: Date;
  allowPrivateContent: Boolean;
  priority: number;
}

export interface LicenseType {
  id: number;
  value: string;
  desc: string;
}

export interface LicenseEntitlement {
  id: string;
}

export interface LicenseTerm {
  inheritable: Boolean;
  startDate: Date;
  ignoreStart: Boolean;
  endDate: Date;
  ignoreEnd: Boolean;
  duration: number;
  gracePeriod: number;
  viewAccess: LicenseAccessLimitType;
  downloadAccess: LicenseAccessLimitType;
  itemRequest: LicenseAccessLimitType;
}

export interface LicenseAccessLimitType {
  count: number;
  limit: number;
  threshold: number;
}

export enum LicenseStatus {
  OK,
  CANCELLED,
  EXPIRED,
  SUSPENDED,
  PROVISIONAL,
}
