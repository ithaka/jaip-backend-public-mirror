export const submit_request_invalid = {
  dois: [],
};

export const submit_request_valid = {
  dois: ["this is a doi"],
};

export const submit_approval_invalid = {
  doi: "this is a doi",
};

export const submit_approval_valid = {
  doi: "this is a doi",
  groups: [1],
};

export const submit_denial_invalid = {
  doi: "this is a doi",
};

export const submit_denial_valid = {
  doi: "this is a doi",
  groups: [1],
  reason: "this is a reason",
  comments: "this is a comment",
};

export const submit_bulk_invalid = {
  disciplines: ["this is a discipline code"],
};

export const submit_bulk_valid = {
  groups: [1],
  disciplines: ["this is a discipline code"],
  journals: ["this is a journal headid"],
  documents: ["this is a doi"],
};

export const submit_bulk_undo_invalid = {
  groups: [1],
};

export const submit_bulk_undo_valid = {
  groups: [1],
  code: "this is a discipline code",
};
