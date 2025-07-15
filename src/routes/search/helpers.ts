import { Status } from "../../types/database";
import { FastifyInstance, FastifyRequest } from "fastify";
import axios, { AxiosResponse } from "axios";
import { Search3Document, Search3Request, Snippet } from "../../types/search";
import { ensure_error } from "../../utils";
import {
  PSEUDO_DISCIPLINE_CODES,
  SEARCH3,
  SEARCH_SNIPPET_SERVICE,
} from "../../consts";
import { JAIPDatabase } from "../../database";
import { globally_restricted_items, status_options } from "@prisma/client";

const status_select = {
  jstor_item_id: true,
  jstor_item_type: true,
  status: true,
  created_at: true,
  entities: {
    select: {
      id: true,
      name: true,
    },
  },
  groups: {
    select: {
      id: true,
      name: true,
    },
  },
  status_details: {
    select: {
      type: true,
      detail: true,
    },
  },
};

export const key_statuses = (
  statuses: Status[],
): { [key: string]: Status[] } => {
  // Iterating through the statuses here and keying them to the doi means that we only have to
  // check the ones that match the doi when we're iterating through the documents.
  const keyed_statuses = {} as { [key: string]: Status[] };
  for (const status of statuses) {
    if (status.jstor_item_id) {
      if (!keyed_statuses[status.jstor_item_id]) {
        keyed_statuses[status.jstor_item_id] = [];
      }
      keyed_statuses[status.jstor_item_id].push(status);
    }
  }
  return keyed_statuses;
};

export const format_status_details = (
  status: Status,
): { comments: string; reason: string } => {
  const comments = status.status_details?.find(
    (detail) => detail.type === "comments",
  )?.detail;
  const reason = status.status_details?.find(
    (detail) => detail.type === "reason",
  )?.detail;
  const statusDetails = {
    comments: comments || "",
    reason: reason || "",
  };
  return statusDetails;
};
export const filter_facility_statuses = (statuses: Status[]) => {
  // Filter out the entity details for all statuses and status details for pending statuses
  // and return the rest of the statuses.
  return statuses.map((status) => {
    const { status_details, ...rest } = status;
    if (status.status === status_options.Pending) {
      return {
        ...rest,
        status_details: [],
        entities: null,
      };
    }
    return {
      ...rest,
      status_details,
      entities: null,
    };
  });
};

export const filter_user_statuses = (statuses: Status[], groups: number[]) => {
  // Filter out the entity details for all statuses and status details for pending statuses
  // and return the rest of the statuses.
  return statuses
    .map((status) => {
      const { status_details, ...rest } = status;
      if (status.status === status_options.Pending) {
        return {
          ...rest,
          status_details: groups.includes(status.groups?.id || 0)
            ? status_details
            : [],
          entities: groups.includes(status.groups?.id || 0)
            ? status.entities
            : null,
        };
      }
      return {
        ...rest,
        status_details,
        entities: null,
      };
    })
    .filter((status) => {
      return (
        status.status !== status_options.Pending ||
        groups.includes(status.groups?.id || 0)
      );
    });
};

export const get_facility_statuses = async (
  db: JAIPDatabase,
  dois: string[],
  groups: number[],
): Promise<[{ [key: string]: Status[] }, Error | null]> => {
  try {
    const [results, error] = await db.get_statuses({
      where: {
        jstor_item_id: {
          in: dois,
        },
        group_id: {
          in: groups,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      distinct: ["jstor_item_id", "group_id"],
      select: status_select,
    });
    if (error) {
      throw error;
    }

    return [key_statuses(filter_facility_statuses(results)), null];
  } catch (err) {
    const error = ensure_error(err);
    return [{}, error];
  }
};

export const get_user_statuses = async (
  db: JAIPDatabase,
  dois: string[],
  groups: number[],
): Promise<[{ [key: string]: Status[] }, Error | null]> => {
  try {
    const [results, error] = await db.get_statuses({
      where: {
        jstor_item_id: {
          in: dois,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      select: status_select,
    });
    if (error) {
      throw error;
    }
    return [key_statuses(filter_user_statuses(results, groups)), null];
  } catch (err) {
    const error = ensure_error(err);
    return [{}, error];
  }
};

export const get_block_list_items = async (
  db: JAIPDatabase,
  dois: string[],
): Promise<[{ [key: string]: globally_restricted_items }, Error | null]> => {
  try {
    const [results, error] = await db.get_restricted_items({
      where: {
        jstor_item_id: {
          in: dois,
        },
        is_restricted: true,
      },
      select: {
        jstor_item_id: true,
        reason: true,
        created_at: true,
      },
    });
    if (error) {
      throw error;
    }
    // Returning the results as a keyed object where the key is the doi
    // will easier to associate with the search results.
    const blocked_items = results.reduce(
      (acc, item) => {
        acc[item.jstor_item_id] = item;
        return acc;
      },
      {} as { [key: string]: globally_restricted_items },
    );
    return [blocked_items, null];
  } catch (err) {
    const error = ensure_error(err);
    return [{}, error];
  }
};
export const get_bulk_statuses = async (
  db: JAIPDatabase,
  arr: string[],
  groups: number[],
): Promise<[Status[], Error | null]> => {
  try {
    const [results, error] = await db.get_statuses({
      where: {
        jstor_item_id: {
          in: arr,
        },
        group_id: {
          in: groups,
        },
      },
      distinct: ["jstor_item_id", "group_id"],
      orderBy: {
        created_at: "desc",
      },
      // There are no status details on a bulk approval, so we can use the facility select here.
      select: status_select,
    });
    if (error) {
      throw error;
    }
    return [results, null];
  } catch (err) {
    const error = ensure_error(err);
    return [[], error];
  }
};
export const get_snippets = async (
  fastify: FastifyInstance,
  ids: string[],
  query: string,
  uuid: string,
): Promise<[{ [key: string]: Snippet[] }, Error | null]> => {
  try {
    // If there is no query string, we don't need (and can't get) snippets.
    if (!query) {
      return [{}, null];
    }

    fastify.log.info(`Getting snippets for ids: ${ids}`);

    const [host, search_error] = await fastify.discover(
      SEARCH_SNIPPET_SERVICE.name,
    );
    if (search_error) {
      throw search_error;
    }

    const snippet_request = {
      allIds: ids.map((id) => ({
        idType: "id",
        idString: id,
      })),
      query: `(${query})`,
    };

    const url = host + "v2/snippets";

    fastify.log.info(`Getting snippets from ${url}`);
    const search_result = await axios({
      url,
      method: "POST",
      data: snippet_request,
      headers: {
        Cookie: `UUID=${uuid}`,
      },
    });

    const snippets: { [key: string]: Snippet[] } = {};
    for (const result of search_result.data.results) {
      snippets[result.id] = result.snippets;
    }

    return [snippets, null];
  } catch (err) {
    const error = ensure_error(err);
    return [{}, error];
  }
};

export const get_tokens = async (
  db: JAIPDatabase,
  request: FastifyRequest,
): Promise<[string[], Error | null]> => {
  const tokens: string[] = [];
  try {
    request.log.info(
      `User is authenticated admin: ${request.is_authenticated_admin}`,
    );
    if (request.is_authenticated_admin) {
      request.log.info(`Getting all tokens for admin user`);
      const [db_tokens, error] = await db.get_all_tokens();
      if (error) {
        throw error;
      }
      db_tokens.forEach((t) => {
        tokens.push(t);
      });
    } else {
      request.log.info(`Using tokens from session`);
      for (const license of request.session.licenses) {
        tokens.push(license.entitlement.id);
      }
    }
  } catch (err) {
    const error = ensure_error(err);
    return [[], error];
  }

  return [tokens, null];
};

export const do_search3 = async (
  host: string,
  search3_request: Search3Request,
  uuid: string,
): Promise<[AxiosResponse | null, Error | null]> => {
  try {
    const url = host + SEARCH3.path;
    const search_result = await axios.post(url, search3_request, {
      headers: {
        Cookie: `UUID=${uuid}`,
      },
    });
    if (search_result.status !== 200) {
      throw new Error("Search request failed: Status code not 200");
    }
    return [search_result, null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

export const get_status_keys = (search_result: AxiosResponse) => {
  // These are the basic search results and the total that will be returned at the end of the
  // handler
  const docs: Search3Document[] = search_result?.data.results || [];
  const total: number = search_result?.data.total || 0;

  // These will be used to fill out the statuses and snippets of each document
  const dois: string[] = [];
  const disc_codes: string[] = [];
  const headids: string[] = [];
  const ids: string[] = [];

  docs.forEach((doc: Search3Document) => {
    // For most purposes, we use the doi, but the search-snippet-service uses the id,
    // so we need to grab that here.
    ids.push(doc.id);
    dois.push(doc.doi);

    if (
      doc.additional_fields.cty &&
      PSEUDO_DISCIPLINE_CODES.includes(doc.additional_fields.cty)
    ) {
      if (!doc.additional_fields.disc_str) {
        doc.additional_fields.disc_str = [];
      }
      doc.additional_fields.disc_str.push(doc.additional_fields.cty);
    }

    if (Array.isArray(doc.additional_fields.disc_str)) {
      doc.additional_fields.disc_str.forEach((disc: string) => {
        if (!disc_codes.includes(disc)) {
          disc_codes.push(disc);
        }
      });
    } else if (doc.additional_fields.disc_str) {
      disc_codes.push(doc.additional_fields.disc_str);
    }

    if (Array.isArray(doc.additional_fields.headid)) {
      doc.additional_fields.headid.forEach((headid: string) => {
        if (!headids.includes(headid)) {
          headids.push(headid);
        }
      });
    } else if (doc.additional_fields.headid) {
      headids.push(doc.additional_fields.headid);
    }
  });

  const disc_and_journal_ids = [...disc_codes, ...headids];

  return { docs, dois, disc_and_journal_ids, ids, total };
};
