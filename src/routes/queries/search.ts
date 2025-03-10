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
    title: (document.title || [])[0] || "",
    subtitle: document.subtitle || "",
    citation_line: document.citation_line || "",
    book_publisher: document.additional_fields.book_publisher || "",
    cty: document.additional_fields.cty || "",
    cty_str: document.additional_fields.cty_str || "",
    fpage: document.additional_fields.fpage || "",
    lpage: document.additional_fields.lpage || "",
    tb: document.additional_fields.tb || "",
    year: document.additional_fields.year || "",
    abstract: document.additional_fields.ab || "",
    book_description: document.additional_fields.book_description || "",
  };
};
