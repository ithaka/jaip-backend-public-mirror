import { FastifyReply, FastifyRequest, RequirementsSchema } from "fastify";
import {
  user_has_feature,
  user_has_feature_in_all_groups,
  user_has_ungrouped_feature,
} from "../../utils";

export const requirements_guard = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const schema = request.routeOptions.schema as RequirementsSchema;

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
  } else {
    has_required_grouped_features_any = true;
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
  } else {
    has_required_grouped_features_all = true;
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
  } else {
    has_required_ungrouped_features = true;
  }

  if (
    has_required_grouped_features_any &&
    has_required_grouped_features_all &&
    has_required_ungrouped_features
  ) {
    return;
  }
  reply.code(403).send();
};
