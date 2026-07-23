import { CITE_OPTIONS, MONTH_UPDATES } from "../../consts/citations/index.js";
import { Cite } from "@citation-js/core";
import type { CSL } from "../../types/citations.js";

export const get_formatted_date = () => {
  const date = new Date();
  let date_string = `${date.toLocaleDateString("en-US", { day: "numeric" })} ${date.toLocaleDateString("en-US", { month: "short" })}. ${date.toLocaleDateString("en-US", { year: "numeric" })}`;
  date_string = date_string.replace(
    /Jun\.|Jul\.|May\.|Sep\./g,
    (monthAbbrev) => {
      return MONTH_UPDATES[monthAbbrev as keyof typeof MONTH_UPDATES];
    },
  );

  return date_string;
};

export const format_cedar_csl = (itemCSL: CSL): CSL => {
  // We need to make some modifications to the CSL data returned from CEDAR before we can use it to generate citations.
  itemCSL.source = "JSTOR";
  // The title returned from CEDAR has <em> tags in it. We need to replace them with <i> tags.
  itemCSL.title = itemCSL.title?.replaceAll("<em>", "<i>");
  itemCSL.title = itemCSL.title?.replaceAll("</em>", "</i>");

  return itemCSL;
};

export const generate_citations = async (csl: CSL) => {
  try {
    const formatted_CSL = format_cedar_csl(csl);

    const citation = new Cite(formatted_CSL);

    const [apa, mla, chicago] = await Promise.all([
      Promise.resolve(
        citation.format("bibliography", {
          style: "apa",
          append: ` Accessed ${get_formatted_date()}.`,
          ...CITE_OPTIONS,
        }),
      ),
      Promise.resolve(
        citation.format("bibliography", {
          style: "mla",
          append: ` Accessed ${get_formatted_date()}.`,
          ...CITE_OPTIONS,
        }),
      ),
      Promise.resolve(
        citation.format("bibliography", {
          style: "chicago",
          append: ` Accessed ${get_formatted_date()}.`,
          ...CITE_OPTIONS,
        }),
      ),
    ]);

    return {
      apa,
      mla,
      chicago,
      has_error: false,
      error_message: "",
    };
  } catch (error) {
    return {
      apa: "",
      mla: "",
      chicago: "",
      has_error: true,
      error_message: (error as Error).message,
    };
  }
};
