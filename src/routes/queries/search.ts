import { MediaRecord } from "../../types/media_record";
import { Search3Document } from "../../types/search";

export const map_document = (document: Search3Document): MediaRecord => {
  return {
    _id: document.doi,
    doi: document.doi,
    iid: document.id,
    authors: document.authors || [],
    score: document.score,
    contentType: document.human_readable_type || "",
    title: Array.isArray(document.title)
      ? document.title[0]
      : document.title
        ? document.title
        : "",
    subtitle: document.subtitle || "",
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
