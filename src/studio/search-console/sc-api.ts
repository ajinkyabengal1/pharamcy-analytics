import type { SearchConsoleData, ScDateRange } from "./search-console-types";

function buildScUrl(apiUrl: string, dateRange: ScDateRange): string {
  const url = new URL(
    apiUrl,
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  );
  url.searchParams.set("range", dateRange);
  if (!url.searchParams.has("mode") && !url.pathname.includes("search-console")) {
    url.searchParams.set("mode", "search-console");
  }
  return url.toString();
}

export async function fetchSearchConsoleData(
  apiUrl: string,
  dateRange: ScDateRange,
  signal?: AbortSignal,
): Promise<SearchConsoleData> {
  const targetUrl = buildScUrl(apiUrl, dateRange);
  const res = await fetch(targetUrl, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(
      err?.error || `Search Console API error: ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<SearchConsoleData>;
}

export async function submitSitemapApi(
  apiUrl: string,
  sitemapUrl: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sitemapUrl }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error || `Submit sitemap error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<{ success: boolean; message: string }>;
}
