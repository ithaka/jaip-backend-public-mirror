import { RouteGenericInterface } from "fastify";
import { SearchRequest } from "./search";
import { Entitlement } from "./accounts";
import { entity_types } from "@prisma/client";
import { Group } from "./groups";

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

export interface EntityParams {
  type: entity_types;
}

export interface MediaReviewRequest extends RouteGenericInterface {
  Body: {
    dois: string[];
    comments?: string;
  };
}

export interface MediaReviewApproval extends RouteGenericInterface {
  Body: {
    doi: string;
    groups: number[];
  };
}

export interface MediaReviewDenial extends RouteGenericInterface {
  Body: {
    doi: string;
    groups: number[];
    reason: string;
    comments: string;
  };
}

export interface MediaReviewBulk extends RouteGenericInterface {
  Body: {
    groups: number[];
    disciplines: string[];
    journals: string[];
    documents: string[];
  };
}

export interface MediaReviewBulUndo extends RouteGenericInterface {
  Body: {
    groups: number[];
    code: string;
  };
}

export interface SearchRequestBody extends RouteGenericInterface {
  Body: SearchRequest;
}

export interface GetEntitiesBody extends RouteGenericInterface {
  Body: GetEntitiesRequest;
}

export interface RemoveEntitiesBody extends RouteGenericInterface {
  Body: RemoveEntitiesRequest;
}

export interface AddEntitiesBody extends RouteGenericInterface {
  Body: AddEntitiesRequest;
}

export interface GetPaginatedBody extends RouteGenericInterface {
  Body: GetPaginatedRequest;
}

export interface AddFeatureBody extends RouteGenericInterface {
  Body: AddFeatureRequest;
}

export interface EditFeatureBody extends RouteGenericInterface {
  Body: EditFeatureRequest;
}
export interface NameOnlyBody extends RouteGenericInterface {
  Body: NameOnlyRequest;
}

export interface IdOnlyBody extends RouteGenericInterface {
  Body: IdOnlyRequest;
}

export interface NameAndIdBody extends RouteGenericInterface {
  Body: NameAndIdRequest;
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

export interface AddFeatureRequest {
  name: string;
  display_name: string;
  category: string;
  description: string;
  is_admin_only: boolean;
  is_protected: boolean;
}

export interface EditFeatureRequest extends AddFeatureRequest {
  id: number;
}
export interface GetPaginatedRequest {
  name?: string;
  page?: number;
  limit?: number;
  is_active: boolean;
}

export interface AddEntitiesRequest {
  id: number;
  contact: string;
  name: string;
  groups: Group[];
}

export interface GetEntitiesRequest {
  query: string;
  page: number;
  groups: number[];
  limit: number;
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
  disc_codes: string[];
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
  created_at: Date;
  updated_at: Date;
  // The duplicate property is only returned when a user attempts to create a duplicate
  // of an existing subdomain.
  duplicate?: boolean;
}
