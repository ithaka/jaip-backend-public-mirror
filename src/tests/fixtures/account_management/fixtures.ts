// The request body is invalid because it is missing the "query" property, which is

import { map_entities } from "../../../routes/queries/entities.js";
import { basic_admin, basic_reviewer } from "../users/fixtures.js";

// required by the schema.
export const get_entities_body_invalid = {
  page: 1,
  groups: [1],
  limit: 1,
};

export const get_entities_body_valid = {
  query: "",
  page: 1,
  groups: [1],
  limit: 1,
};

export const expected_get_users = {
  3: map_entities(basic_reviewer),
  4: map_entities(basic_admin),
};

export const remove_entities_body_invalid = {
  id: 1,
};

export const remove_entities_body_valid = {
  groups: [
    {
      id: 1,
    },
  ],
  id: 1,
};

export const add_entities_body_invalid = {
  id: 1,
};

export const add_entities_body_valid = {
  groups: [
    {
      id: 1,
    },
  ],
  contact: "test@test.edu",
  name: "Test User",
};
