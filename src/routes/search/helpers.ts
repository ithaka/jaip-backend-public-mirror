import { PrismaClient } from "@prisma/client";
import { Status } from "../../types/database";
import { FastifyInstance, FastifyRequest } from "fastify";
import axios, { AxiosResponse } from "axios";
import {
  Search3Document,
  Search3Request,
  SnippetResult,
} from "../../types/search";
import { ensure_error } from "../../utils";
import { SEARCH_SNIPPET_SERVICE } from "../../consts";

const facility_select = {
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
};
const user_select = {
  ...facility_select,
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
export const get_facility_statuses = async (
  db: PrismaClient,
  dois: string[],
  groups: number[],
): Promise<[{ [key: string]: Status[] }, Error | null]> => {
  try {
    const results = await db.statuses.findMany({
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
      take: 1,
      select: facility_select,
    });
    return [key_statuses(results), null];
  } catch (err) {
    const error = ensure_error(err);
    return [{}, error];
  }
};

export const get_user_statuses = async (
  db: PrismaClient,
  dois: string[],
): Promise<[{ [key: string]: Status[] }, Error | null]> => {
  try {
    const results = await db.statuses.findMany({
      where: {
        jstor_item_id: {
          in: dois,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      select: user_select,
    });
    return [key_statuses(results), null];
  } catch (err) {
    const error = ensure_error(err);
    return [{}, error];
  }
};

export const get_bulk_statuses = async (
  db: PrismaClient,
  arr: string[],
  groups: number[],
): Promise<[Status[], Error | null]> => {
  try {
    const results = await db.statuses.findMany({
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
      select: facility_select,
    });
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
): Promise<[{ [key: string]: SnippetResult }, Error | null]> => {
  try {
    // If there is no query string, we don't need (and can't get) snippets.
    if (!query) {
      return [{}, null];
    }

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

    const search_result = await axios({
      url,
      method: "POST",
      data: snippet_request,
      headers: {
        Cookie: `UUID=${uuid}`,
      },
    });

    const snippets: { [key: string]: SnippetResult } = {};
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
  db: PrismaClient,
  request: FastifyRequest,
): Promise<[string[], Error | null]> => {
  const tokens: string[] = [];
  try {
    if (request.is_authenticated_admin) {
      const db_tokens = await db.tokens.findMany({
        select: {
          token: true,
        },
      });
      db_tokens.forEach((t) => {
        tokens.push(t.token);
      });
    } else {
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
    const url = host + "v3.0/jstor/basic";
    const search_result = await axios({
      url,
      method: "POST",
      data: search3_request,
      headers: {
        Cookie: `UUID=${uuid}`,
      },
    });
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
