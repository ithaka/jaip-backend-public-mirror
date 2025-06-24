import { RouteGenericInterface } from "fastify";
import { SearchRequest, StatusSearchRequest } from "./search";
import { Entitlement } from "./accounts";
import { entity_types } from "@prisma/client";
import { Group } from "./groups";

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

export interface UnblockItem extends RouteGenericInterface {
  Body: {
    doi: string;
  };
}

export interface BlockItem extends RouteGenericInterface {
  Body: {
    doi: string;
    reason: string;
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
export interface StatusSearchRequestBody extends RouteGenericInterface {
  Body: StatusSearchRequest;
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

export interface AddGroupFeatureBody extends RouteGenericInterface {
  Body: AddGroupFeatureRequest;
}

export interface EditGroupFeatureBody extends RouteGenericInterface {
  Body: EditGroupFeatureRequest;
}

export interface AddUngroupedFeatureBody extends RouteGenericInterface {
  Body: AddUngroupedFeatureRequest;
}

export interface EditUngroupedFeatureBody extends RouteGenericInterface {
  Body: EditUngroupedFeatureRequest;
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

export interface AddGroupFeatureRequest extends AddUngroupedFeatureRequest {
  is_admin_only: boolean;
  is_protected: boolean;
}
export interface EditGroupFeatureRequest extends AddGroupFeatureRequest {
  id: number;
}

export interface EditUngroupedFeatureRequest
  extends AddUngroupedFeatureRequest {
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
  disciplines: { [key: string]: string };
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
