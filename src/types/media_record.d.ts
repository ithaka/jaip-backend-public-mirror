export interface MediaRecord {
  _id: string;
  score: number;
  abstract: string | string[];
  authors: string[];
  primary_agents?: string[];
  book_description: string;
  book_publisher: string;
  citation_line: string;
  contentType: string;
  cty: string;
  cty_str: string;
  doi: string;
  ocr?: string;
  fpage: string;
  history?: History[] | null;
  iid: string;
  lpage: string;
  mediaReviewStatuses?: { [key: string]: History };
  national_history?: History[] | null;
  snippets?: Snippet[];
  subtitle: string[] | string;
  tb: string;
  title: string;
  year: string | number;
  is_restricted?: boolean;
  restricted_reason?: string;
  collection_titles?: string[];
  cc_compilation_titles?: string[];
}

export interface History {
  entityID?: number;
  entityName?: string;
  status: Status;
  statusLabel: string;
  statusCreatedAt: Date | null;
  createdAt?: Date | null;
  entityName?: string;
  groupName?: string;
  groupID?: number;
  statusDetails?: StatusDetails;
  entityID?: number;
}

export enum StatusOptions {
  Approved = "Approved",
  ApprovedByDiscipline = "Approved by Discipline",
  ApprovedByJournal = "Approved by Journal",
  Denied = "Denied",
  Pending = "Pending",
}

export interface StatusDetails {
  comments?: string;
  reason?: string;
}

export interface Snippet {
  id: string;
  text: string;
}

export interface SeparateHistories {
  [key: string]: History[];
}
