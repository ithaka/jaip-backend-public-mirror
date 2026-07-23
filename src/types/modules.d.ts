declare module "*.csl?raw" {
  const content: string;
  export default content;
}

declare module "@citation-js/core" {
  export interface CiteFormatOptions {
    format?: string;
    lang?: string;
    style?: string;
    append?: string;
    [key: string]: unknown;
  }

  export class Cite {
    constructor(data?: unknown, options?: Record<string, unknown>);
    format(type: string, options?: CiteFormatOptions): string;
  }

  export const plugins: {
    config: {
      get(ref: string): {
        styles: {
          add(name: string, template: string): void;
        };
      };
    };
  };
}

declare module "@citation-js/plugin-csl";
