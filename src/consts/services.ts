export const SESSION_MANAGER = {
  name: "session-manager",
  path: "v1/graphql",
};

export const SEARCH_SERVICE = {
  name: "search-service",
  path: "disciplines/",
};

export const SEARCH3 = {
  name: "search3",
  path: "v3.0/jstor/basic",
  queries: {
    defaults: {
      additional_fields: [
        "headid",
        "disc_str",
        "book_publisher",
        "book_description",
        "fpage",
        "lpage",
        "tb",
        "year",
        "ab",
        "cty",
        "cty_str",
      ],
      filter_queries: [
        '-ti:("Front Matter" OR "Back Matter" OR EDITORIAL OR "Volume Information" OR "INDEX TO ADVERTISERS")',
      ],
      content_set_flags: [
        "search_article",
        "search_chapter",
        "pamphlet",
        "review",
        "research_report",
        "mp_research_report_part",
      ],
      tokens: [],
    },
    maps: {
      contentType: "cty_str",
      disciplines: "disc_str",
    } as { [key: string]: string },
  },
};

export const SEARCH_SNIPPET_SERVICE = {
  name: "search-snippet-service",
  path: "v2/snippets",
};
