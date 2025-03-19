import { entity_types, Prisma, PrismaClient, user_roles } from "@prisma/client";
import { get_db_pagination } from "../../utils/database";
import {
  get_many_entities_select_clause,
  map_entities,
} from "../queries/entities";
import { User } from "../../types/entities";
import { ensure_error } from "../../utils";
import { Group } from "../../types/groups";

const get_entities_where_clause = (
  groups: number[],
  role: user_roles,
  query: string,
) => {
  return {
    where: {
      entities: {
        groups_entities: {
          some: {
            group_id: {
              in: groups,
            },
            role: {
              equals: role,
            },
          },
        },
      },
      OR: [
        {
          jstor_id: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
          entities: {
            name: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      ],
    },
  };
};

export const get_users = async (
  db: PrismaClient,
  query: string,
  page: number,
  groups: number[],
  limit: number,
): Promise<[{ total: number; entities: User[] } | null, Error | null]> => {
  try {
    const [count, users] = await db.$transaction([
      db.users.count(
        get_entities_where_clause(groups, user_roles.admin, query),
      ),
      db.users.findMany({
        ...get_db_pagination(page, limit),
        orderBy: {
          entities: {
            name: "asc",
          },
        },
        ...get_entities_where_clause(groups, user_roles.admin, query),
        select: get_many_entities_select_clause(user_roles.admin, groups),
      }),
    ]);
    return [
      {
        total: count,
        entities: users.map((user) => map_entities(user)),
      },
      null,
    ];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

export const get_facilities = async (
  db: PrismaClient,
  query: string,
  page: number,
  groups: number[],
  limit: number,
): Promise<[{ total: number; entities: User[] } | null, Error | null]> => {
  try {
    const [count, facilities] = await db.$transaction([
      db.facilities.count(
        get_entities_where_clause(groups, user_roles.user, query),
      ),
      db.facilities.findMany({
        ...get_db_pagination(page, limit),
        orderBy: {
          entities: {
            name: "asc",
          },
        },
        ...get_entities_where_clause(groups, user_roles.user, query),
        select: get_many_entities_select_clause(user_roles.user, groups),
      }),
    ]);
    return [
      {
        total: count,
        entities: facilities.map((facility) => map_entities(facility)),
      },
      null,
    ];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

const get_remove_entity_query = (id: number, groups: Group[]) => ({
  where: {
    id: id,
  },
  data: {
    entities: {
      update: {
        groups_entities: {
          updateMany: {
            where: {
              group_id: {
                in: groups.map((group) => group.id),
              },
              role: user_roles.admin,
            },
            data: {
              role: user_roles.removed,
              updated_at: new Date(),
            },
          },
        },
        features_groups_entities: {
          updateMany: {
            where: {
              enabled: true,
              group_id: {
                in: groups.map((group) => group.id),
              },
            },
            data: {
              enabled: false,
              updated_at: new Date(),
            },
          },
        },
      },
    },
  },
});

export const remove_user = async (
  db: PrismaClient,
  id: number,
  groups: Group[],
): Promise<Error | null> => {
  try {
    db.users.update(get_remove_entity_query(id, groups));
    return null;
  } catch (err) {
    const error = ensure_error(err);
    return error;
  }
};

export const remove_facility = async (
  db: PrismaClient,
  id: number,
  groups: Group[],
): Promise<Error | null> => {
  try {
    db.facilities.update(get_remove_entity_query(id, groups));
    return null;
  } catch (err) {
    const error = ensure_error(err);
    return error;
  }
};

const trim_entity = (entity: User): User => {
  entity.contact = entity.contact!.trim().toLowerCase();
  entity.name = entity.name.trim().toLowerCase();
  return entity;
};

export const add_or_edit_entity = async (
  db: PrismaClient,
  entity: User,
  type: entity_types,
  is_manager: boolean,
): Promise<Error | null> => {
  try {
    // Trim whitespace from the entity's contact and name fields and convert to lowercase
    entity = trim_entity(entity);

    // It is possible that the user submitting this request does not have the required permissions
    // to see that the entity they're adding already exists in another group. So first we check for that possibility.
    let existing_entity = {} as { id: number } | null;
    if (type === entity_types.users) {
      existing_entity = await db.users.findUnique({
        where: {
          jstor_id: entity.contact,
        },
        select: {
          id: true,
        },
      });
    } else {
      existing_entity = await db.facilities.findUnique({
        where: {
          jstor_id: entity.contact,
        },
        select: {
          id: true,
        },
      });
    }

    // If an existing entity is found with a matching email, we edit the existing entity, rather than creating a new one.
    // We basically have to use the stored procedures because Prisma can't handle a the depth of nesting we need in
    // a reasonable amount of time (e.g., adding a user with four groups, each of which has 15 features). A transaction will
    // time out, and there's no good way to roll back individual changes outside of a transaction.
    // TODO: We could simplify the data structure considerably, which might make it more effective to use Prisma.
    if (existing_entity?.id) {
      entity.id = existing_entity.id;
      await db.$queryRaw`CALL edit_${type}(${entity}::json,${is_manager})`;
    } else {
      await db.$queryRaw`CALL add_${type}(${entity}::json,${is_manager})`;
    }

    return null;
  } catch (err) {
    const error = ensure_error(err);
    return error;
  }
};
