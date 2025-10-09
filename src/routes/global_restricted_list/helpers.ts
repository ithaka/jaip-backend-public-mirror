import { CSVRestrictedItem, RestrictedItem } from "../../types/routes.js";

export const map_restricted_items_list = (
  restricted_items: RestrictedItem[],
) => {
  return restricted_items.map((item) => {
    const list_item: CSVRestrictedItem = {
      "JSTOR Item ID": item.jstor_item_id,
      "JSTOR Item URL": `https://www.jstor.org/stable/${item.jstor_item_id}`,
      Reason: item.reason,
      "Date Added to List": item.created_at,
      "Date Updated": item.updated_at,
    };
    if (item.entities && item.entities.name) {
      list_item["Restricted By"] = item.entities.name;
    }
    return list_item;
  });
};
