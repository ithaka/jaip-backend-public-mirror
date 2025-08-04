import { map_document } from "../../../routes/queries/search";
import { Status } from "../../../types/database";
import { MediaRecord } from "../../../types/media_record";

export const search_request_invalid = {
  query: "test",
  pageNo: 1,
  limit: 10,
  sort: "new",
  filters: ["year: [1665 TO 2025]"],
};

export const search_request_valid = {
  pageNo: 1,
  limit: 25,
  sort: "new",
  facets: ["contentType", "disciplines"],
  filters: ["year: [1665 TO 2025]"],
  query: "",
};
export const status_search_request_invalid = {
  ...search_request_invalid,
};
export const status_search_request_valid = {
  ...search_request_valid,
  statusQuery: "Approved",
  statusStartDate: new Date("2023-10-01T00:00:00Z"),
  statusEndDate: new Date("2023-10-01T00:00:00Z"),
  groups: [1],
};

export const tokens = [
  "123959837372834",
  "123959836153375",
  "99999002910209",
  "59331631",
];

export const search3_results = {
  total: 847834,
  paging: {
    next: "cGFnZU1hcms9Mg==",
    current_page: 1,
  },
  requestId: "9dbea809-669c-4bac-91c6-8bc4d2dfc16f",
  imageRelevancyPrediction: null,
  results: [
    {
      id: "2f79f022-1ba9-31d0-95c3-497d81e818ed",
      doi: "10.2307/resrep62411",
      score: 1,
      additional_fields: {
        year: 2024,
        cty: "research_report",
        cty_str: "research_report",
        disc_str: ["astronomy-discipline", "sciencemathematics-discipline"],
        book_description:
          "\n<p>Indonesia’s President Joko Widodo, early during his first term of office, declared his country a middle power. However, long before “middle power” became a common phrase in diplomatic and political circles, Indonesia acted like a middle power: building regional institutions, setting norms of international relations, mediating conflict resolution processes, and promoting multilateral dialogue.</p>\n<p>What is a middle power? Scholars and pundits cannot seem to agree on a common definition. According to Dr. Dino Patti Djalal, Chairman and Founder of the Foreign Policy Community of Indonesia (FPCI), a middle power must meet three criteria: size, in terms of population and territorial</p\n",
        book_publisher:
          '[{"publisher":"East-West Center","code":"eastwestcenter","role":"LICENSOR"}]',
        tb: "How Will the Probowo Administration Shape Indonesia’s Foreign Policy as a Middle Power?",
      },
    },
    {
      id: "bb4b2810-5aa8-3ca2-b4cf-a2ac4c594cca",
      doi: "10.2307/resrep62436",
      score: 1,
      additional_fields: {
        year: 2024,
        cty: "research_report",
        cty_str: "research_report",
        disc_str: ["astronomy-discipline", "sciencemathematics-discipline"],
        headid: ["523aeaad-063a-3be6-980a-c2b61e0526f6"],
        book_description:
          "\n<p>The share of appraisal waivers for both GSEs combined for June 2024 stood at 13%, the same as last month and down 36 ppts. from its series’ peak in March 2021.</p>\n<p>Shares for Fannie and Freddie appeared to diverge again in June 2024 after having moved in lock step since August 2023.</p>\n<p>Freddie introduced ACE+PDR* in July 2022. In June 2024, these shares stood at 1.9%, 2.5%, and 2.9% for Purchase, Cash-Out, and No Cash-Out loans, respectively.</p>\n<p>Fannie introduced Value Acceptance + Property Data (VA+PD)** in April 2023. In June 2024, the share of the new program was 0.6%, 5.7%,</p>\n",
        book_publisher:
          '[{"publisher":"American Enterprise Institute","code":"aei","role":"LICENSOR"}]',
        tb: "Prevalence of GSE Appraisal Waivers",
      },
    },
    {
      id: "5caee2c7-cd6b-3fd3-9aaa-804fde36f779",
      doi: "10.2307/resrep62406",
      score: 1,
      additional_fields: {
        year: 2024,
        cty: "research_report",
        cty_str: "research_report",
        headid: ["523aeaad-063a-3be6-980a-c2b61e0526f6"],
        book_description:
          "\n<p>The Arctic is warming at an alarming rate, approximately three times faster than the global average. This rapid temperature increase has led to significant environmental changes, including retreating sea ice, thawing permafrost, and increased coastal erosion. These changes have far-reaching implications not only for the Arctic region but also for the entire planet. Understanding and addressing these impacts are crucial for achieving global climate stability. Japan is not an Arctic state but is readily affected by climate change in the Arctic region through oceanic and atmospheric circulation. In terms of political geography, Japan is closest to the Arctic Ocean in</p>\n",
        book_publisher:
          '[{"publisher":"East-West Center","code":"eastwestcenter","role":"LICENSOR"}]',
        tb: "Japan’s Arctic Policy:",
      },
    },
    {
      id: "cbd8c5f1-ac9d-3f54-a40e-0c43ba4b3bbe",
      doi: "10.2307/resrep62407",
      score: 1,
      additional_fields: {
        year: 2024,
        cty: "research_report",
        cty_str: "research_report",
        book_description:
          "\n<p>The prospect of deepening cooperation between the People’s Republic of China (PRC) and the Russian Federation (Russia) in the Arctic is an important question mark and challenge for the United States and its allies in the Arctic region and beyond.</p>\n<p>The data on Sino-Russian cooperation and collaboration in the Arctic is mixed: some indications appear to point in a positive direction, while significant caveats must be acknowledged. Some of the important categories include energy, shipping, fishing, and military/security sectors. Sino-Russian cooperation in the Arctic cannot— and should not—be separated from the broader context of their evolving global relationship.</p>\n<p>Russia’s</p>\n",
        book_publisher:
          '[{"publisher":"East-West Center","code":"eastwestcenter","role":"LICENSOR"}]',
        tb: "US Perspectives on Sino-Russian Cooperation in the Arctic and Roles for Partners",
      },
    },
  ],
};

export const bulk_statuses = [
  {
    jstor_item_id: "523aeaad-063a-3be6-980a-c2b61e0526f6",
    jstor_item_type: "headid",
    status: "Approved",
    // created_at: new Date('2023-10-01T00:00:00Z'),
    entities: { id: 3, name: "Test Reviewer" },
    groups: { id: 1, name: "Ithaka" },
  },
  {
    jstor_item_id: "astronomy-discipline",
    jstor_item_type: "discipline",
    status: "Approved",
    // created_at: new Date('2023-10-01T00:00:00Z'),
    entities: { id: 3, name: "Test Reviewer" },
    groups: { id: 1, name: "Ithaka" },
  },
];

export const item_statuses = [
  {
    jstor_item_id: "10.2307/resrep62411",
    jstor_item_type: "doi",
    status: "Denied",
    // created_at: new Date('2023-10-01T00:00:00Z'),
    entities: { id: 3, name: "Test Reviewer" },
    groups: { id: 1, name: "Ithaka" },
    status_details: [
      {
        type: "comments",
        detail: "This is a test comment.",
      },
      {
        type: "reason",
        detail: "This is a test reason.",
      },
    ],
  },
  {
    jstor_item_id: "10.2307/resrep62407",
    jstor_item_type: "doi",
    status: "Incomplete",
    // created_at: new Date('2023-10-01T00:00:00Z'),
    entities: { id: 3, name: "Test Reviewer" },
    groups: { id: 1, name: "Ithaka" },
    status_details: [
      {
        type: "comments",
        detail: "This is a test comment.",
      },
      {
        type: "reason",
        detail: "This is a test reason.",
      },
    ],
  },
];
const bulk_approval_base_object = {
  groupID: 1,
  groupName: "Ithaka",
  status: "Approved",
  statusDetails: {
    comments: "",
    reason: "",
  },
};
const approved_by_discipline_media_review_object = {
  "1": {
    ...bulk_approval_base_object,
    statusLabel: "Approved by Discipline",
  },
};
const approved_by_journal_media_review_object = {
  "1": {
    ...bulk_approval_base_object,
    statusLabel: "Approved by Journal",
  },
};

const item_status_base_object = {
  groupID: 1,
  groupName: "Ithaka",
};

export const denied_item_status = {
  "1": {
    ...item_status_base_object,
    status: "Denied",
    statusLabel: "Denied",
    statusDetails: {
      comments: "This is a test comment.",
      reason: "This is a test reason.",
    },
  },
};

export const denied_item_status_reviewer = {
  "1": {
    ...denied_item_status["1"],
  },
};
export const incomplete_item_status = {
  "1": {
    ...item_status_base_object,
    status: "Incomplete",
    statusLabel: "Incomplete",
    statusDetails: {
      comments: "This is a test comment.",
      reason: "This is a test reason.",
    },
  },
};
export const incomplete_item_status_reviewer = {
  "1": {
    ...incomplete_item_status["1"],
  },
};
export const processed_search_response = search3_results.results.map((doc) => {
  return {
    ...map_document(doc),
    // There are no statuses, so we can return an empty object
    mediaReviewStatuses: {},
  };
});
const add_approved_by_discipline_status = (doc: MediaRecord) => {
  return {
    ...doc,
    mediaReviewStatuses: {
      ...approved_by_discipline_media_review_object,
    },
  };
};
const add_approved_by_journal_status = (doc: MediaRecord) => {
  return {
    ...doc,
    mediaReviewStatuses: {
      ...approved_by_journal_media_review_object,
    },
  };
};

export const processed_search_response_with_bulk_statuses = [
  add_approved_by_discipline_status(processed_search_response[0]),
  add_approved_by_discipline_status(processed_search_response[1]),
  add_approved_by_journal_status(processed_search_response[2]),
  ...processed_search_response.slice(3),
];

export const processed_search_response_with_mixed_statuses = [
  {
    ...processed_search_response[0],
    mediaReviewStatuses: {
      ...denied_item_status,
    },
  },
  add_approved_by_discipline_status(processed_search_response[1]),
  add_approved_by_journal_status(processed_search_response[2]),
  {
    ...processed_search_response[3],
    mediaReviewStatuses: {
      ...incomplete_item_status,
    },
  },
];

export const processed_search_response_with_mixed_statuses_reviewer = [
  {
    ...processed_search_response[0],
    mediaReviewStatuses: {
      ...denied_item_status_reviewer,
    },
    history: [
      {
        ...denied_item_status_reviewer["1"],
      },
    ],
  },
  add_approved_by_discipline_status(processed_search_response[1]),
  add_approved_by_journal_status(processed_search_response[2]),
  {
    ...processed_search_response[3],
    mediaReviewStatuses: {
      ...incomplete_item_status_reviewer,
    },
    history: [
      {
        ...incomplete_item_status_reviewer["1"],
      },
    ],
  },
];

export const search_status_results = [
  {
    entity_id: 3,
    jstor_item_id: "10.2307/resrep62411",
    jstor_item_type: "doi",
    status: "Denied",
    group_id: 1,
    created_at: new Date("2023-10-01T00:00:00Z"),
  },
  {
    entity_id: 3,
    jstor_item_id: "10.2307/resrep62436",
    jstor_item_type: "doi",
    status: "Approved",
    group_id: 1,
    created_at: new Date("2023-10-01T00:00:00Z"),
  },
  {
    entity_id: 3,
    jstor_item_id: "10.2307/resrep62406",
    jstor_item_type: "doi",
    status: "Approved",
    group_id: 1,
    created_at: new Date("2023-10-01T00:00:00Z"),
  },
  {
    entity_id: 3,
    jstor_item_id: "10.2307/resrep06056",
    jstor_item_type: "doi",
    status: "Approved",
    group_id: 2,
    created_at: new Date("2023-10-01T00:00:00Z"),
  },
] as Status[];

export const status_search_dois = search_status_results.map(
  (status) => status.jstor_item_id,
);
export const processed_search_response_with_mixed_statuses_and_status_order =
  status_search_dois
    .map((doi) => {
      const doc = processed_search_response.find((doc) => doc.doi === doi);
      if (doc) {
        return {
          ...doc,
          mediaReviewStatuses: {
            ...processed_search_response_with_mixed_statuses.find(
              (doc) => doc.doi === doi,
            )?.mediaReviewStatuses,
          },
        };
      }
    })
    .filter((doc) => doc !== undefined);
export const processed_search_response_with_mixed_statuses_reviewer_and_status_order =
  status_search_dois
    .map((doi) => {
      const doc = processed_search_response_with_mixed_statuses_reviewer.find(
        (doc) => doc.doi === doi,
      );
      if (doc) {
        return {
          ...doc,
          mediaReviewStatuses: {
            ...processed_search_response_with_mixed_statuses_reviewer.find(
              (doc) => doc.doi === doi,
            )?.mediaReviewStatuses,
          },
        };
      }
    })
    .filter((doc) => doc !== undefined);

    export const status_selections = [
  {
    id: 2755,
    status: 'Denied',
    jstor_item_id: '10.2307/23006127',
    jstor_item_type: 'doi',
    group_id: 1
  },
  {
    id: 2755,
    status: 'Denied',
    jstor_item_id: '10.2307/23006127',
    jstor_item_type: 'doi',
    group_id: 1
  },
  {
    id: 2745,
    status: 'Approved',
    jstor_item_id: '10.2307/1260890',
    jstor_item_type: 'doi',
    group_id: 1
  },
  {
    id: 2743,
    status: 'Pending',
    jstor_item_id: '10.2979/jfemistudreli.33.1.25',
    jstor_item_type: 'doi',
    group_id: 1
  },
]