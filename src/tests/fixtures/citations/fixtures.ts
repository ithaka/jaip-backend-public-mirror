import type { CSL } from "../../../types/citations.js";

// A representative CSL payload as returned by the cedar delivery service for a
// journal article. The handler passes this straight into generate_citations.
export const cedar_csl_response: CSL = {
  id: "test-iid",
  type: "article-journal",
  title: "A <em>Study</em> of Something Interesting",
  "container-title": "Journal of Interesting Studies",
  author: [
    { family: "Doe", given: "Jane" },
    { family: "Roe", given: "Richard" },
  ],
  issued: { "date-parts": [[2005, 6, 1]] },
  volume: "12",
  issue: "3",
  page: "45-67",
  publisher: "University Press",
  ISSN: "1234-5678",
};

// The citation output produced by generate_citations for cedar_csl_response
// when the system clock is pinned to 2026-01-15 (the route tests use
// fake timers).
export const expected_citation_response = {
  apa: '<div class="csl-bib-body">\n  <div data-csl-entry-id="test-iid" class="csl-entry">Doe, J., &#38; Roe, R. (2005). A <i>Study</i> of Something Interesting. <i>Journal of Interesting Studies</i>, <i>12</i>(3), 45–67. Accessed 15 Jan. 2026.</div>\n</div>',
  mla: '<div class="csl-bib-body">\n  <div data-csl-entry-id="test-iid" class="csl-entry">Doe, Jane, and Richard Roe. “A <i>Study</i> of Something Interesting.” <i>Journal of Interesting Studies</i>, vol. 12, no. 3, June 2005, pp. 45–67. Accessed 15 Jan. 2026.</div>\n</div>',
  chicago:
    '<div class="csl-bib-body">\n  <div data-csl-entry-id="test-iid" class="csl-entry">Doe, Jane, and Richard Roe. “A <i>Study</i> of Something Interesting.” <i>Journal of Interesting Studies</i> 12, no. 3 (2005): 45–67. Accessed 15 Jan. 2026.</div>\n</div>',
  has_error: false,
  error_message: "",
};
