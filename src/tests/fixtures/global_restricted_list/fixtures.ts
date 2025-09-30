export const restrict_valid = {
  doi: "10.1234/example.doi",
  reason: "Sexually explicit",
};

export const restrict_invalid = {
  doi: "10.1234/example.doi",
};

export const unrestrict_valid = {
  doi: "10.1234/example.doi",
};

export const unrestrict_invalid = {
  reason: "No longer relevant",
};

export const restricted_items_list = [
  {
    id: 1,
    entity_id: 2,
    jstor_item_id: "10.2307/resrep62409",
    is_restricted: true,
    reason: "Sexually explicit",
    created_at: new Date("2023-10-01T00:00:00Z"),
    updated_at: new Date("2023-10-01T00:00:00Z"),
  },
  {
    id: 1,
    entity_id: 2,
    jstor_item_id: "10.2307/resrep62410",
    is_restricted: true,
    reason: "Sexually explicit",
    created_at: new Date("2023-10-01T00:00:00Z"),
    updated_at: new Date("2023-10-01T00:00:00Z"),
  },
  {
    id: 1,
    entity_id: 2,
    jstor_item_id: "10.2307/resrep62437",
    is_restricted: true,
    reason: "Sexually explicit",
    created_at: new Date("2023-10-01T00:00:00Z"),
    updated_at: new Date("2023-10-01T00:00:00Z"),
  },
  {
    id: 1,
    entity_id: 2,
    jstor_item_id: "10.2307/2870061",
    is_restricted: true,
    reason: "Sexually explicit",
    created_at: new Date("2023-10-01T00:00:00Z"),
    updated_at: new Date("2023-10-01T00:00:00Z"),
  },
  {
    id: 1,
    entity_id: 2,
    jstor_item_id: "10.2307/25101093",
    is_restricted: true,
    reason: "Inflammatory or inciting violence, uprisings, or riots",
    created_at: new Date("2023-10-01T00:00:00Z"),
    updated_at: new Date("2023-10-01T00:00:00Z"),
  },
  {
    id: 1,
    entity_id: 2,
    jstor_item_id: "10.2307/j.ctt1287j69.67",
    is_restricted: true,
    reason: "Inflammatory or inciting violence, uprisings, or riots",
    created_at: new Date("2023-10-01T00:00:00Z"),
    updated_at: new Date("2023-10-01T00:00:00Z"),
  },
];
export const restricted_items_download = [restricted_items_list, null];
