import { Discipline, Journal } from "../../types/disciplines.js";
import {
  bulk_approval_query,
  map_bulk_approval_status,
} from "../queries/bulk_approval.js";
import { FastifyInstance } from "fastify";
import { ensure_error } from "../../utils/index.js";
import { jstor_types, status_options } from "../../database/prisma/client.js";
import { STATUS_OPTIONS } from "../../consts/index.js";
import { Group } from "../../types/groups.js";

type RequiredCode = Required<string>;

export const attach_bulk_approval = async (
  fastify: FastifyInstance,
  type: jstor_types,
  items: Journal[] | Discipline[],
  groups: Group[],
): Promise<[Journal[] | Discipline[], Error | null]> => {
  const globally_approved_groups = groups.filter(
    (group) => group.has_global_approval,
  );
  if (globally_approved_groups.length) {
    // If there are globally approved groups, we pre-populate the bulk_approval field for each item with their approval status
    // so that we don't need to query the database for these groups later. Using a shallow copy to avoid depending on structuredClone,
    // which we might not have available in all environments.
    items = items.slice();
    // We then iterate over each item and attach the bulk approval information for the globally approved groups.
    items.forEach((item, index) => {
      items[index] = {
        ...item,
        bulk_approval: globally_approved_groups.map((group) => ({
          status: STATUS_OPTIONS.GloballyApproved,
          statusDetails: [],
          status_created_at: null,
          groupName: group.name,
          groupID: group.id,
        })),
      };
    });
  }

  // Filter out the groups that do not have global approval, as we need to check their bulk approval statuses separately.
  const bulk_approval_groups = groups
    .filter((group) => !group.has_global_approval)
    .map((group) => group.id);
  // If there are no groups, we don't need to check for statuses
  if (!bulk_approval_groups.length) {
    return [items, null];
  }

  fastify.log.info(`Getting bulk approval statuses for ${type}`);
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
  fastify.log.info(
    `Getting bulk approval statuses using ${codes.length} codes`,
  );
  try {
    const [response, error] = await fastify.db.get_bulk_statuses(
      bulk_approval_query(type, codes, bulk_approval_groups),
    );
    if (error) {
      throw error;
    }
    if (response && response.length) {
      fastify.log.info(`Checking journals and disciplines`);
      // Map the bulk approval statuses by jstor_item_id for quick lookup.
      const approvals_by_code = new Map<
        string,
        ReturnType<typeof map_bulk_approval_status>[]
      >();
      for (const status of response) {
        if (
          status.status !== status_options.Approved ||
          !status.jstor_item_id
        ) {
          continue;
        }
        const approvals = approvals_by_code.get(status.jstor_item_id) || [];
        approvals.push(map_bulk_approval_status(status));
        approvals_by_code.set(status.jstor_item_id, approvals);
      }
      items.forEach((item) => {
        // Determine the code for the current item based on its type. This will be used to look up its bulk approval statuses.
        const code =
          type === jstor_types.discipline && "code" in item
            ? item.code
            : type === jstor_types.headid && "headid" in item
              ? item.headid
              : undefined;
        // Look up the bulk approval statuses for the current item using its code, if available.
        const approvals = code ? approvals_by_code.get(code) : undefined;
        if (approvals?.length) {
          item.bulk_approval = [
            ...(globally_approved_groups.length
              ? item.bulk_approval || []
              : []),
            ...approvals,
          ];
        }
      });
    }
    return [items, null];
  } catch (err) {
    console.log(err);
    const error = ensure_error(err);
    return [[], error];
  }
};
