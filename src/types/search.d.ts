export interface SearchRequest {
  query: string;
  pageNo: number;
  limit: number;
  sort: string;
  filters: string[];
  facets: string[];
  groups?: number[];
  statusStartDate?: Date;
  statusEndDate?: Date;
}
export interface Search3Request {
  query: string;
  limit: number;
  sort: string;
  page_mark: string;
  additional_fields: string[];
  filter_queries: string[];
  content_set_flags: string[];
  ms_facet_fields?: MsFacetFields[];
  tokens: string[];
}

export interface MsFacetFields {
  field: string;
  minCount: number;
  limit: number;
  alias?: string;
  efq?: string[];
}

export interface Search3Response {
  total: number;
  results: Search3Document[];
}
export interface Search3Document {
  id: string;
  doi: string;
  score: number;
  raw_type: string;
  type?: string;
  title?: string[];
  subtitle?: string[];
  translated_title?: string[];
  authors?: string[];
  citation_line?: string;
  is_review?: string;
  reviewed_works?: string[];
  serial_numbers?: string[];
  journal?: string[];
  jid?: string[];
  iid?: string[];
  book_volume?: string;
  edition?: string[];
  editor?: string[];
  publisher?: components.Publisher[];
  tokens?: string[];
  flags?: string[];
  resource_type?: string;
  book_doi?: string;
  publication_year?: number;
  ab_segment: string;
  human_readable_type?: string;
  additional_fields: {
    headid?: string[];
    disc_str?: string[];
    book_publisher?: string;
    lpage?: string;
    fpage?: string;
    book_description?: string;
    tb?: string;
    year?: number;
    ab?: string[];
    cty_str?: string;
    cty?: string;
  };
  tb?: string;
  tbsub?: string;
  captions?: string[];
  item_title?: string;
  sequence_number?: string;
  cc_compilation_ids?: string[];
  cc_compilation_titles?: string[];
  cc_dates?: date[];
  cc_image_view_description?: string[];
  cc_locations?: string[];
  cc_origin_description?: string[];
  cc_physical_attributes?: string[];
  cc_repository?: string[];
  cc_reuse_license?: string[];
  cc_work_type?: string[];
  display_date?: date;
  external_link?: string;
  identifiers?: string[];
  primary_agents?: string[];
  project_id?: string;
  ps_desc?: string[];
  ps_relation?: string[];
  ps_rights?: string;
  ps_source?: string[];
  ps_subject?: string[];
  ps_type?: string;
  publication_title?: string;
  rectype?: string;
  secondary_agents?: string[];
  year?: number;
}

export interface SnippetResult {
  id: string;
  snippets: Snippet[];
}

export interface Snippet {
  id: string;
  text: string;
}
