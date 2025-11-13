import { SWAGGER_TAGS, OFFLINE_INDICES } from "../../consts/index.js";
import { standard_errors } from "../../utils/index.js";

export const route_schemas = {
  download_offline_index: {
    description: `Returns a pre-signed S3 URL for downloading offline index zip files. The returned download_url can be used directly to fetch large zip files without server memory limitations. <strong>Use the download_url in a new request to download the actual file.</strong>`,
    tags: [SWAGGER_TAGS.public],
    route: `/offline/:index_id`,
    params: {
      type: "object",
      required: ["index_id"],
      properties: {
        index_id: {
          type: "string",
          enum: Object.keys(OFFLINE_INDICES),
          description: "The ID of the offline index to download.",
        },
      },
    },
    response: {
      200: {
        type: "object",
        required: ["download_url", "filename", "expires_in"],
      },
      ...standard_errors,
    },
  },
};
