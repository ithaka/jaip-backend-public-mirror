import { FastifyReply, FastifyRequest, RequirementsSchema } from "fastify";
import {
  user_has_feature,
  user_has_feature_in_all_groups,
  user_has_ungrouped_feature,
} from "../../utils/index.js";

export const requirements_guard = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const schema = request.routeOptions.schema as RequirementsSchema;

  const has_no_requirements = !schema?.requires;

  // Begin by assuming the user has no required features
  let has_required_grouped_features_any = false;
  let has_required_grouped_features_all = false;
  let has_required_ungrouped_features = false;

  // If having any of the features in any group is sufficient, check for that
  if (schema?.requires?.any?.grouped?.any?.length) {
    const any = schema.requires.any.grouped.any;
    for (const feature of any) {
      if (user_has_feature(request.user, feature)) {
        has_required_grouped_features_any = true;
        break;
      }
    }
  }
  // If having any of the features in an array in all groups is necessary, check for that
  if (schema?.requires?.any?.grouped?.all?.length) {
    const all = schema.requires.any.grouped.all;
    for (const feature of all) {
      if (user_has_feature_in_all_groups(request.user, feature)) {
        has_required_grouped_features_all = true;
        break;
      }
    }
  }

  // If having any of the ungrouped features in an array is sufficient, check for that
  if (schema?.requires?.any?.ungrouped?.length) {
    const any = schema.requires.any.ungrouped;
    for (const feature of any) {
      if (user_has_ungrouped_feature(request.user, feature)) {
        has_required_ungrouped_features = true;
        break;
      }
    }
  }

  if (
    has_required_grouped_features_any ||
    has_required_grouped_features_all ||
    has_required_ungrouped_features ||
    has_no_requirements
  ) {
    return;
  }
  reply.code(403).send();
};
