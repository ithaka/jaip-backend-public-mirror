import { SWAGGER_TAGS } from "../../consts";
import { Discipline, Journal } from "../../types/disciplines";
import { standard_errors } from "../../utils";

export const route_schemas = {
  disciplines: {
    name: "disciplines",
    description: `Returns an array of discipline objects.`,
    tags: [SWAGGER_TAGS.private],
    response: {
      200: {
        type: "array",
        items: {} as Discipline,
      },
      ...standard_errors,
    },
  },
  journals: {
    name: "journals",
    description: `Returns an array of journal objects in a provided discipline.`,
    tags: [SWAGGER_TAGS.private],
    path: {
      type: "string",
      properties: {
        code: {
          type: "string",
        },
      },
    },
    response: {
      200: {
        type: "array",
        items: {} as Journal,
      },
      ...standard_errors,
    },
  },
};
