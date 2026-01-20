import { FEATURES, SWAGGER_TAGS } from "../../consts/index.js";
import { standard_errors } from "../../utils/index.js";
// TODO: When AnalyticsData type is locked down in the databricks setup, uncomment the following line
// For now, we use additionalProperties: true in the response schema to allow any shape of object
// import { AnalyticsData } from "../../types/analytics.js";

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
          any: [FEATURES.view_analytics],
        },
      },
    },
    response: {
      200: {
        description: "Analytics data object (AnalyticsData)",
        type: "object",
        additionalProperties: true,
      },
      ...standard_errors,
    },
  },
};
