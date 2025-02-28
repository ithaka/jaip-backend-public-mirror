import { SWAGGER_TAGS } from "../../consts";
import { Discipline, Journal } from "../../types/disciplines";

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
      500: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  journals: {
    name: "journals",
    description: `Returns an array of journal objects in a provided discipline.`,
    tags: [SWAGGER_TAGS.private],
    params: {
      type: "object",
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
      500: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};
