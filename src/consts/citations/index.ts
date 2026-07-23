import { plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import mlaCsl from "./styles/mla.csl?raw";
import apaCsl from "./styles/apa.csl?raw";
import chicagoCsl from "./styles/chicago.csl?raw";

export const STYLES = ["mla", "apa", "chicago"] as const;
export type CitationStyle = (typeof STYLES)[number];

export const STYLE_TEMPLATE_BY_NAME: Record<CitationStyle, string> = {
  mla: mlaCsl,
  apa: apaCsl,
  chicago: chicagoCsl,
};

export const MONTH_UPDATES = {
  "May.": "May",
  "Jun.": "June",
  "Jul.": "July",
  "Sep.": "Sept.",
} as const;

export const CITE_OPTIONS = { format: "html", lang: "en-US" };

export const cslPlugin = plugins.config.get("@csl");
for (const styleName of STYLES) {
  cslPlugin.styles.add(styleName, STYLE_TEMPLATE_BY_NAME[styleName]);
}
