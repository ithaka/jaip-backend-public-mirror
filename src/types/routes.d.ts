import { RouteGenericInterface } from "fastify";
import { SearchRequest } from "./search";
import { Entitlement } from "./accounts";

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
