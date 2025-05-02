import { jstor_types, Prisma } from "@prisma/client";
import { Status } from "../../types/database";

export const bulk_approval_query = (
  type:
    | jstor_types
    | Prisma.FieldRef<"statuses", "jstor_types">
    | null
    | undefined,
  codes: string[],
  groups: number[],
): Prisma.statusesFindManyArgs => {
  return {
    distinct: ["jstor_item_id", "group_id"],
    select: {
      jstor_item_id: true,
      jstor_item_type: true,
      groups: {
        select: {
          id: true,
          name: true,
        },
      },
      status: true,
      status_details: {
        select: {
          type: true,
          detail: true,
        },
      },
    },
    where: {
      jstor_item_type: {
        equals: type,
      },
      jstor_item_id: {
        in: codes,
      },
      group_id: {
        in: groups,
      },
    },
    orderBy: {
      id: "desc",
    },
  };
};

export const map_bulk_approval_status = (bulk: Status) => {
  return {
    status: bulk.status,
    statusDetails: bulk.status_details,
    status_created_at: bulk.created_at,
    groupName: bulk.groups?.name,
    groupID: bulk.groups?.id,
  };
};
