import { defineConfig } from "tsup";

const shared = {
  format: ["cjs", "esm"] as ("cjs" | "esm")[],
  dts: true,
  sourcemap: false,
  splitting: false,
  external: ["react", "react-dom", "next", "sanity", "next/script", "next/navigation"],
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: "src/index.ts",
      "server/index": "src/server/index.ts",
      "studio/index": "src/studio/index.tsx",
    },
  },
  {
    // The bundler drops per-file directives, so mark the whole client entry as a client module
    // for Next.js server components (e.g. MixpanelInit / AnalyticsProvider in the root layout).
    ...shared,
    entry: { "client/index": "src/client/index.ts" },
    banner: { js: '"use client";' },
  },
]);
