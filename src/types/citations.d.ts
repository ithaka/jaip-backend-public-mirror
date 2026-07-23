export type CSLItemType =
  | "article"
  | "article-journal"
  | "article-magazine"
  | "article-newspaper"
  | "bill"
  | "book"
  | "broadcast"
  | "chapter"
  | "classic"
  | "collection"
  | "dataset"
  | "document"
  | "entry"
  | "entry-dictionary"
  | "entry-encyclopedia"
  | "event"
  | "figure"
  | "graphic"
  | "hearing"
  | "interview"
  | "legal_case"
  | "legislation"
  | "manuscript"
  | "map"
  | "motion_picture"
  | "musical_score"
  | "pamphlet"
  | "paper-conference"
  | "patent"
  | "performance"
  | "periodical"
  | "personal_communication"
  | "post"
  | "post-weblog"
  | "regulation"
  | "report"
  | "review"
  | "review-book"
  | "software"
  | "song"
  | "speech"
  | "standard"
  | "thesis"
  | "treaty"
  | "webpage"
  | (string & {});

export interface CSLName {
  family?: string;
  given?: string;
  suffix?: string;
  literal?: string;
  "non-dropping-particle"?: string;
  "dropping-particle"?: string;
}

export type CSLDatePart = [year: number, month?: number, day?: number];

export interface CSLDate {
  "date-parts": CSLDatePart[];
  season?: 1 | 2 | 3 | 4;
  circa?: boolean;
  literal?: string;
  raw?: string;
}

export interface CSL {
  id?: string;
  type: CSLItemType;

  title?: string;
  "title-short"?: string;
  "container-title"?: string;
  "container-title-short"?: string;
  "volume-title"?: string;

  author?: CSLName[];
  editor?: CSLName[];
  translator?: CSLName[];

  issued?: CSLDate;
  accessed?: CSLDate;
  "event-date"?: CSLDate;
  "original-date"?: CSLDate;

  publisher?: string;
  "publisher-place"?: string;
  source?: string;
  abstract?: string;
  note?: string;

  volume?: string | number;
  issue?: string | number;
  edition?: string | number;
  page?: string;
  "page-first"?: string;

  DOI?: string;
  ISBN?: string;
  ISSN?: string;
  URL?: string;
  language?: string;

  [key: string]: unknown;
}
