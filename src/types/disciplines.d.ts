import type { BulkHistory } from "./media_records";
import type { Journal } from "./journals";

export interface Counts {
  books: number;
  journals: number;
  pamphlets: number;
}

export interface Discipline {
  bulk_approval?: BulkHistory[];
  journals?: Journal[];
  code: string;
  count?: number;
  counts: Counts;
  label: string;
  parent: boolean;
  parent_code?: string;
  parent_label?: string;
  titleCount: number;
  titles: string;
}

export interface AlternateDiscipline {
  code: string;
  label: string;
  alternate_codes: string[];
}
export interface DisciplineObject {
  [key: string]: Discipline;
}

export interface Journal {
  bulk_approval?: BulkHistory[];
  headid: string;
  head_title: Title;
  all_titles: Title[];
  all_ids: string[];
  discipline?: string;
}

export interface Title {
  bidirectional_category: string;
  cil: boolean;
  doi: string;
  end_year: string;
  id: string;
  jcode: string[];
  jid: string[];
  other_ids: string[];
  pub_code: string;
  publisher: string;
  publishers: Publishers;
  sort_title: string;
  start_year: string;
  sub_title: string;
  title: string;
  type: string;
  years: string;
}

export interface Publishers {
  [key: string]: string;
}

export interface SortedJournals {
  [key: string]: {
    [key: string]: Journal;
  };
}
