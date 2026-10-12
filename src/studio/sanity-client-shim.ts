/**
 * Client shim for Sanity queries within the analytics dashboard.
 * Queries Sanity via native fetch without requiring @sanity/client as an extra dependency.
 */

const projectId =
  typeof process !== "undefined"
    ? process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ""
    : "";
const dataset =
  typeof process !== "undefined"
    ? process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production"
    : "production";
const apiVersion = "2024-01-01";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const sanityClient = {
  fetch: async <T = any>(query: string, params: Record<string, any> = {}): Promise<T> => {
    if (!projectId) return [] as unknown as T;
    try {
      const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
      url.searchParams.set("query", query);
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(`$${k}`, JSON.stringify(v));
      }
      const res = await fetch(url.toString());
      if (!res.ok) return [] as unknown as T;
      const data = (await res.json()) as { result?: T };
      return (data.result ?? ([] as unknown as T)) as T;
    } catch {
      return [] as unknown as T;
    }
  },
};
