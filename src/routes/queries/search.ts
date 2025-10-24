import { MediaRecord } from "../../types/media_record.js";
import { Search3Document } from "../../types/search.js";

const find_title = (document: Search3Document): string => {
  if (Array.isArray(document.title)) {
    return document.title[0] || "";
  }
  if (document.title) {
    return document.title || "";
  }
  if (document.item_title) {
    return document.item_title || "";
  }
  return "";
};

export const map_document = (document: Search3Document): MediaRecord => {
  return {
    _id: document.doi,
    doi: document.doi,
    iid: document.id,
    authors: document.author || [],
    primary_agents: document.primary_agents || [],
    score: document.score,
    contentType: document.human_readable_type || "",
    title: find_title(document),
    subtitle: document.subtitle || "",
    collection_titles: document.collection_titles || [],
    cc_compilation_titles: document.cc_compilation_titles || [],
    citation_line: document.citation_line || "",
    book_publisher: document.additional_fields.book_publisher || "",
    cty: document.additional_fields.cty || "",
    cty_str: document.additional_fields.cty_str || "",
    fpage: document.additional_fields.fpage || "",
    lpage: document.additional_fields.lpage || "",
    tb: document.additional_fields.tb || "",
    year: document.additional_fields.year || "",
    abstract: Array.isArray(document.additional_fields.ab)
      ? document.additional_fields.ab[0]
      : document.additional_fields.ab
        ? document.additional_fields.ab
        : "",
    book_description: Array.isArray(document.additional_fields.book_description)
      ? document.additional_fields.book_description[0]
      : document.additional_fields.book_description
        ? document.additional_fields.book_description
        : "",
  };
};
