import { jstor_types, Prisma } from "@prisma/client";

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
    distinct: ["jstor_item_id"],
    where: {
      jstor_item_type: {
        equals: type,
      },
      jstor_item_id: {
        in: codes,
      },
      status: {
        equals: "Approved",
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
