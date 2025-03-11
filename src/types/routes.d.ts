import { RouteGenericInterface } from "fastify";
import { SearchRequest } from "./search";

export interface DiscParams {
  code: string;
}

export interface StatusParams {
  status: string;
}

export interface PagesParams {
  iid: string;
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
