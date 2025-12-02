/**
 * Collection metadata for reentry guides and other documents.
 *
 * @interface CollectionMetadata
 * @property {string} title
 * @property {string} description
 * @property {string} filename - PDF filename (follows naming convention below)
 * @property {string} thumbnail - PNG thumbnail filename
 * @property {string} creator - Primary author/organization
 * @property {string} contributor - Additional contributors
 * @property {string} publisher - Publishing organization
 * @property {string} date
 * @property {string} type - Content type
 * @property {string} format - Format description
 * @property {number} page_count
 * @property {AlternateDocumentVersion[]} alternate_versions
 * @property {string} subject
 * @property {string} location - Geographic origin of the creator
 * @property {string} language - Primary language
 * @property {string} jurisdiction - Legal jurisdiction or focus of the guide
 * @property {boolean} is_national
 * @property {string} state_code - State code or "USA"
 * @property {string[]} subject_arr
 *
 * ## Filename Convention: `{guide-name}-{year}-{state-code}-{lang}.{ext}`
 * - **guide-name**: kebab-case guide identifier
 * - **year**: publication year (2025, 2024)
 * - **state-code**: lowercase state/country (ny, il, tn, usa)
 * - **lang**: language code (en, es)
 * - **ext**: file extension (pdf, png)
 *
 * @example "connections-2025-ny-en.pdf", "new-path-2025-usa-es.pdf"
 */
export interface CollectionMetadata {
  title: string;
  description: string;
  filename: string;
  creator: string;
  contributor: string;
  publisher: string;
  date: string;
  type: string;
  format: string;
  subject: string;
  location: string;
  language: string;
  jurisdiction: string;
  is_national: boolean;
  state_code: string;
  subject_arr: string[];
}
