import path from "node:path";
import { promises as fs } from "node:fs";
import { defineConfig } from "tsup";

// esbuild plugin that resolves `?raw` query imports and inlines the file's
// contents as a string. Keeps parity with Vite's `?raw` behavior so the same
// source imports work under both `tsup` (production build) and Vitest.
const rawLoaderPlugin = {
  name: "raw-loader",
  setup(build: {
    onResolve: (
      opts: { filter: RegExp },
      cb: (args: { path: string; resolveDir: string }) => {
        path: string;
        namespace: string;
      },
    ) => void;
    onLoad: (
      opts: { filter: RegExp; namespace: string },
      cb: (args: { path: string }) => Promise<{
        contents: string;
        loader: "text";
      }>,
    ) => void;
  }) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, "")),
      namespace: "raw-loader",
    }));

    build.onLoad({ filter: /.*/, namespace: "raw-loader" }, async (args) => ({
      contents: await fs.readFile(args.path, "utf8"),
      loader: "text",
    }));
  },
};

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "node24",
  platform: "node",
  sourcemap: true,
  clean: true,
  splitting: false,
  bundle: true,
  esbuildPlugins: [rawLoaderPlugin],
});
