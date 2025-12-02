import {
  entity_types,
  Prisma,
  user_roles,
} from "../../database/prisma/client.js";
import { get_db_pagination } from "../../utils/index.js";
import {
  get_many_entities_select_clause,
  map_entities,
} from "../queries/entities.js";
import { User } from "../../types/entities.js";
import { ensure_error } from "../../utils/index.js";
import { Group } from "../../types/groups.js";
import { JAIPDatabase } from "../../database/index.js";

const get_entities_where_clause = (
  groups: number[],
  role: user_roles,
  query: string,
  include_ungrouped: boolean = false,
) => {
  let entities_clause = {};
  const roles: user_roles[] = [role];
  if (!include_ungrouped) {
    entities_clause = {
      groups_entities: {
        some: {
          group_id: {
            in: groups,
          },
          role: {
            in: roles,
          },
        },
      },
    };
  }
  const where_clause: Prisma.usersFindManyArgs = {
    where: {
      entities: entities_clause,
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
  return where_clause;
};

export const get_users = async (
  db: JAIPDatabase,
  query: string,
  page: number,
  groups: number[],
  limit: number,
  include_ungrouped: boolean = false,
): Promise<
  [{ total: number; entities: { [key: string]: User } } | null, Error | null]
> => {
  try {
    const count_query = get_entities_where_clause(
      groups,
      user_roles.admin,
      query,
      include_ungrouped,
    ) as Prisma.usersCountArgs;
    const users_query = {
      ...get_db_pagination(page, limit),
      orderBy: {
        entities: {
          name: "asc",
        },
      },
      ...(get_entities_where_clause(
        groups,
        user_roles.admin,
        query,
        include_ungrouped,
      ) as Prisma.usersFindManyArgs),
      select: get_many_entities_select_clause(user_roles.admin, groups),
    } as Prisma.usersFindManyArgs;
    const [count, users] = await db.get_users_and_count(
      count_query,
      users_query,
    );
    const filtered_users = users.filter((user) => user);
    const entities = filtered_users.reduce(
      (acc, current) => {
        if (current?.entities?.id) {
          const user = map_entities(current);
          acc[current.entities.id] = user;
        }
        return acc;
      },
      {} as { [key: string]: User },
    );
    return [
      {
        total: count,
        // return the users as an object with the key being the user id
        entities,
      },
      null,
    ];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

export const get_facilities = async (
  db: JAIPDatabase,
  query: string,
  page: number,
  groups: number[],
  limit: number,
): Promise<
  [{ total: number; entities: { [key: string]: User } } | null, Error | null]
> => {
  try {
    const count_query = get_entities_where_clause(
      groups,
      user_roles.user,
      query,
    ) as Prisma.facilitiesCountArgs;
    const facilities_query = {
      ...get_db_pagination(page, limit),
      orderBy: {
        entities: {
          name: "asc",
        },
      },
      ...get_entities_where_clause(groups, user_roles.user, query),
      select: {
        ...get_many_entities_select_clause(user_roles.user, groups),
        subdomains_facilities: {
          select: {
            subdomain: true,
            sitecode: true,
          },
        },
      },
    } as Prisma.facilitiesFindManyArgs;
    const [count, facilities] = await db.get_facilities_and_count(
      count_query,
      facilities_query,
    );
    const filtered_facilities = facilities.filter((facility) => facility);
    const entities = filtered_facilities.reduce(
      (acc, current) => {
        if (current?.entities?.id) {
          const user = map_entities(current);
          acc[current.entities.id] = user;
        }
        return acc;
      },
      {} as { [key: string]: User },
    );
    return [
      {
        total: count,
        // return the users as an object with the key being the user id
        entities,
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
  db: JAIPDatabase,
  id: number,
  groups: Group[],
): Promise<Error | null> => {
  try {
    await db.remove_user(get_remove_entity_query(id, groups));
    return null;
  } catch (err) {
    const error = ensure_error(err);
    return error;
  }
};

export const remove_facility = async (
  db: JAIPDatabase,
  id: number,
  groups: Group[],
): Promise<Error | null> => {
  try {
    db.remove_facility(get_remove_entity_query(id, groups));
    return null;
  } catch (err) {
    const error = ensure_error(err);
    return error;
  }
};

const trim_entity = (entity: User): User => {
  entity.contact = entity.contact!.trim().toLowerCase();
  entity.name = entity.name.trim();
  return entity;
};

export const add_or_edit_entity = async (
  db: JAIPDatabase,
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
      existing_entity = await db.get_user_id({
        where: {
          jstor_id: entity.contact,
        },
        select: {
          id: true,
        },
      });
    } else {
      existing_entity = await db.get_facility_id({
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
    const action = existing_entity?.id ? "edit" : "add";
    if (existing_entity?.id) {
      entity.id = existing_entity.id;
    }
    if (action === "add" && type === entity_types.facilities && !is_manager) {
      throw new Error("User does not have permission to add facilities");
    }
    await db.manage_entity(action, type, entity, is_manager);
    return null;
  } catch (err) {
    const error = ensure_error(err);
    return error;
  }
};
