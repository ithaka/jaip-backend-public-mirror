import { Discipline, Journal } from "../../types/disciplines";
import {
  bulk_approval_query,
  map_bulk_approval_status,
} from "../queries/bulk_approval";
import { FastifyInstance } from "fastify";
import { ensure_error } from "../../utils";
import { jstor_types } from "@prisma/client";

type RequiredCode = Required<string>;

export const attach_bulk_approval = async (
  fastify: FastifyInstance,
  type: jstor_types,
  items: Journal[] | Discipline[],
  groups: number[],
): Promise<[Journal[] | Discipline[], Error | null]> => {
  // If there are no groups, we don't need to check for statuses
  if (!groups.length) {
    return [items, null];
  }

  const codes = items
    .map((item) => {
      if (type === jstor_types.discipline && "code" in item) {
        return item.code;
      } else if (type === jstor_types.headid && "headid" in item) {
        return item.headid;
      }
    })
    .filter((code): code is RequiredCode => {
      return !!code;
    });

  try {
    const response = await fastify.db.get_statuses(
      bulk_approval_query(type, codes, groups),
    );

    console.log("DISCIPLINES BULK APPROVAL");
    console.log(response);
    if (response && response.length) {
      // Cycle through every discipline
      items.forEach((item) => {
        // Get an array of all statuses for this discipline
        const statuses = response.filter((status) => {
          if (type === jstor_types.discipline && "code" in item) {
            return status.jstor_item_id === item.code;
          } else if (type === jstor_types.headid && "headid" in item) {
            return status.jstor_item_id === item.headid;
          }
        });

        // If there are statuses for this discipline, add them to the discipline object
        if (statuses.length) {
          item.bulk_approval = statuses.map((status) =>
            map_bulk_approval_status(status),
          );
        }
      });
    }

    return [items, null];
  } catch (err) {
    const error = ensure_error(err);
    return [[], error];
  }
};
