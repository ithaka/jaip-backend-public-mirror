export interface MediaRecord {
  _id: string;
  _score: number;
  abstract: string;
  authors: string[];
  book_description: string;
  book_publisher: string;
  citation_line: string;
  contentType: string;
  cty: string;
  cty_str: string;
  doi: string;
  ocr?: string;
  semanticTerms: string[];
  fpage: string;
  history: History[] | null;
  iid: string;
  log_history: History[];
  log_media_review_statuses: { [key: string]: History };
  log_national_history: History[];
  lpage: string;
  mediaReviewStatuses: { [key: string]: History };
  national_history: History[] | null;
  snippets: Snippet[];
  subtitle: string[] | string;
  tb: string;
  title: string;
  year: number;
}

export interface History {
  status: Status;
  statusLabel: string;
  statusCreatedAt: Date;
  createdAt?: Date;
  entityName?: string;
  groupName: string;
  groupID: number;
  statusDetails?: StatusDetails;
  entityID?: number;
}

export interface BulkHistory {
  status: Status;
  createdAt: Date;
  entityName?: string;
  groupName: string;
  groupID: number;
  statusDetails?: StatusDetails;
  entityID?: number;
}

export enum Status {
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
