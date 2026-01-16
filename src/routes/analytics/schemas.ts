import { FEATURES, SWAGGER_TAGS } from "../../consts/index.js";
import { AnalyticsData } from "../../types/analytics.js";
import { standard_errors } from "../../utils/index.js";

export const route_schemas = {
  get_analytics: {
    name: "get_analytics",
    description: `Returns a json of analytics data for a given group id.`,
    method: "GET",
    tags: [SWAGGER_TAGS.private],
    route: "/:group_id",
    requires: {
      any: {
        grouped: {
          any: [FEATURES.manage_facilities], //TODO: Change when analytics feature is complete
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "Analytics data for the specified group",
            additionalProperties: {} as AnalyticsData,
          },
        },
        required: ["data"],
      },
      ...standard_errors,
    },
  },
};
