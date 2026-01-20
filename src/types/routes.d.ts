import { RouteGenericInterface } from "fastify";
import { Entitlement } from "./accounts.js";
import {
  alert_statuses,
  entity_types,
  globally_restricted_items,
} from "../database/prisma/client.js";
import { Group } from "./groups.js";
import { OFFLINE_INDICES } from "../consts/index.js";

export interface RouteSettings {
  routes: (
    fastify: FastifyInstance,
    opts: RouteShorthandOptions,
  ) => Promise<void>;
  options: { prefix?: string };
}

export interface DiscParams {
  code: string;
}

export interface StatusParams {
  status: string;
}

export interface PagesParams {
  iid: string;
  page?: string;
}

const enum CustomContentCollections {
  reentry = "reentry",
}
export interface CustomContentParams {
  collection: CustomContentCollections;
  filename?: string;
}

export interface EntityParams {
  type: entity_types;
}

export interface OfflineIndexParams {
  index_id: keyof typeof OFFLINE_INDICES;
}

export interface MediaReviewRequest extends RouteGenericInterface {
  dois: string[];
  comments?: string;
}

export interface MediaReviewApproval extends RouteGenericInterface {
  doi: string;
  groups: number[];
}

export interface UnrestrictItem extends RouteGenericInterface {
  doi: string;
}

export interface RestrictItem extends RouteGenericInterface {
  doi: string;
  reason: string;
}

export interface MediaReviewDenial extends RouteGenericInterface {
  doi: string;
  groups: number[];
  reason: string;
  comments: string;
}

export interface MediaReviewBulk extends RouteGenericInterface {
  groups: number[];
  disciplines: string[];
  journals: string[];
  documents: string[];
}

export interface MediaReviewBulkUndo extends RouteGenericInterface {
  groups: number[];
  code: string;
}
export interface IdOnlyRequest {
  id: number;
}

export interface NameOnlyRequest {
  name: string;
}
export interface NameAndIdRequest {
  name: string;
  id: number;
}

export interface AddGroupFeatureRequest extends AddUngroupedFeatureRequest {
  is_admin_only: boolean;
  is_protected: boolean;
}
export interface EditGroupFeatureRequest extends AddGroupFeatureRequest {
  id: number;
}

export interface EditUngroupedFeatureRequest extends AddUngroupedFeatureRequest {
  id: number;
}
export interface AddUngroupedFeatureRequest {
  name: string;
  display_name: string;
  category: string;
  description: string;
}
export interface GetPaginatedRequest {
  name: string;
  page: number;
  limit: number;
  is_active: boolean;
}
export interface GetPaginatedGroupedRequest {
  name: string;
  page: number;
  limit: number;
  is_active: boolean;
  groups: number[];
}
export interface GetRestrictedItemsRequest {
  query: string;
  pageNo: number;
  limit: number;
  statusStartDate?: Date;
  statusEndDate?: Date;
  sort?: string;
}
export interface AddEntitiesRequest {
  id: number;
  contact: string;
  name: string;
  groups: Group[];
  ungrouped_features?: {
    [key: string]: {
      id: number;
      name: string;
      display_name: string;
      category: string;
      description: string;
      is_active: boolean;
    };
  };
}

export interface GetEntitiesRequest {
  query: string;
  page: number;
  groups: number[];
  limit: number;
  include_ungrouped?: boolean;
}

export interface RemoveEntitiesRequest {
  id: number;
  groups: Group[];
}

export interface CedarMetadataReturn {
  itemType: string;
  contentType: string;
  isRightToLeft: boolean;
  pageCount: number;
  status: number;
}

export interface CedarItemView {
  page_images: string[];
  thumbs: string[];
  pdf: string;
  item_type: string;
  content_type: string;
  bidirectional_category: string;
  doi: string;
  id: string;
  disc_code: string[];
  discipline: string[];
  page_count: string;
  iiif_links?: string[];
  disciplines: { [key: string]: string };
  identity_block: CedarIdentityBlock;
}

export interface CedarIdentityBlock {
  issue_iid: string[];
  issue_doi: string[];
  jcode: string[];
  journal_iid: string[];
  doi: string[];
}

export interface ALEResponse {
  item: string;
  iid: string;
  jcode: string[];
  sessionEntitlements: Entitlement[];
}

export interface PDFDownloadLicense {
  licenseType: string;
  licensePriority: number;
  ddaThreshold: DDAThreshold;
  license: string;
  licenseSubType: string;
  entitlement: string;
  licenseTags: string[];
  displayFormats?: string[];
  licenseLegacyID: string;
}
export interface DDAThreshold {
  pdf_download: number;
  view_item: number;
}
export interface EntitlementMap {
  [key: string]: PDFDownloadLicense[];
}

export interface Subdomain {
  subdomain: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  // The duplicate property is only returned when a user attempts to create a duplicate
  // of an existing subdomain.
  duplicate?: boolean;
}

export interface AddAlertRequest {
  text: string;
  status: alert_statuses;
  is_active: boolean;
  start_date: Date;
  end_date: Date;
  subdomains?: string[];
  groups?: number[];
  facilities?: number[];
}

export interface EditAlertRequest extends AddAlertRequest {
  id: number;
}

interface RestrictedItem extends globally_restricted_items {
  entities?: {
    name: string;
  };
}

interface CSVRestrictedItem {
  "JSTOR Item ID": string;
  "JSTOR Item URL": string;
  Reason: string;
  "Date Added to List": Date;
  "Date Updated": Date;
  "Restricted By"?: string;
}
