import { SignJWT, importPKCS8 } from "jose";

/* ─── Configuration & Types ─────────────────────────────────────────────── */

export interface AnalyticsServerConfig {
  gaPropertyId?: string;
  gaServiceAccountEmail?: string;
  gaPrivateKey?: string;
  searchConsoleSiteUrl?: string;
  searchConsoleServiceAccountEmail?: string;
  searchConsolePrivateKey?: string;
  corsOrigin?: string;
}

const GA_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const SC_API_BASE = "https://www.googleapis.com/webmasters/v3";

const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const SC_SCOPE = "https://www.googleapis.com/auth/webmasters";

interface CachedToken {
  value: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();

/**
 * Obtain a Google OAuth 2.0 access token using a service account PKCS#8 private key.
 */
async function getAccessToken(
  scope: string,
  clientEmail?: string,
  privateKeyRaw?: string,
): Promise<string> {
  const email = clientEmail || process.env.GA_SERVICE_ACCOUNT_EMAIL;
  const rawKey = privateKeyRaw || process.env.GA_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Missing GA_SERVICE_ACCOUNT_EMAIL or GA_PRIVATE_KEY environment variables / configuration",
    );
  }

  const cacheKey = `${email}:${scope}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const privateKey = rawKey.replace(/\\n/g, "\n").trim();
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      `Auth failed: GA_PRIVATE_KEY must be a PKCS#8 PEM key (starts with "-----BEGIN PRIVATE KEY-----"). ` +
      `Got: "${privateKey.substring(0, 40)}…" — check the key is from your Google service account JSON "private_key" field.`
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(privateKey, "RS256");

  const jwt = await new SignJWT({ scope })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(email)
    .setAudience(GA_TOKEN_URL)
    .sign(key);

  const tokenRes = await fetch(GA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to obtain Google access token: ${await tokenRes.text()}`);
  }

  const { access_token, expires_in } = (await tokenRes.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache.set(cacheKey, {
    value: access_token,
    expiresAt: Date.now() + (expires_in - 60) * 1000,
  });

  return access_token;
}

/* ─── GA4 Low-Level Helpers ──────────────────────────────────────────────── */

async function gaReport(
  propertyId: string,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${GA_API_BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(
      err?.error?.message || `GA API error ${res.status}: ${res.statusText}`,
    );
  }
  return res.json() as Promise<Record<string, unknown>>;
}

async function gaRealtimeReport(
  propertyId: string,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${GA_API_BASE}/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, unknown>>;
}

/* ─── Search Console Low-Level Helpers ───────────────────────────────────── */

async function scQuery(
  siteUrl: string,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const encodedSite = encodeURIComponent(siteUrl);
  const res = await fetch(
    `${SC_API_BASE}/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(
      err?.error?.message ?? `Search Console API error ${res.status}: ${res.statusText}`,
    );
  }

  return res.json() as Promise<Record<string, unknown>>;
}

async function fetchSitemaps(
  siteUrl: string,
  token: string,
): Promise<Record<string, unknown>> {
  const encodedSite = encodeURIComponent(siteUrl);
  const res = await fetch(`${SC_API_BASE}/sites/${encodedSite}/sitemaps`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(
      err?.error?.message ?? `Sitemaps API error ${res.status}: ${res.statusText}`,
    );
  }

  return res.json() as Promise<Record<string, unknown>>;
}

async function submitSitemap(
  siteUrl: string,
  feedpath: string,
  token: string,
): Promise<void> {
  const encodedSite = encodeURIComponent(siteUrl);
  const encodedFeed = encodeURIComponent(feedpath);
  const res = await fetch(
    `${SC_API_BASE}/sites/${encodedSite}/sitemaps/${encodedFeed}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(
      err?.error?.message ?? `Submit sitemap error ${res.status}: ${res.statusText}`,
    );
  }
}

/* ─── Search Console Utilities ───────────────────────────────────────────── */

const COUNTRY_NAMES: Record<string, string> = {
  usa: "United States", gbr: "United Kingdom", ind: "India", deu: "Germany",
  fra: "France", can: "Canada", aus: "Australia", bra: "Brazil", jpn: "Japan",
  ita: "Italy", esp: "Spain", nld: "Netherlands", mex: "Mexico", kor: "South Korea",
  rus: "Russia", chn: "China", tur: "Turkey", idn: "Indonesia", pol: "Poland",
  swe: "Sweden", nor: "Norway", dnk: "Denmark", fin: "Finland", che: "Switzerland",
  aut: "Austria", bel: "Belgium", prt: "Portugal", irl: "Ireland", nzl: "New Zealand",
  zaf: "South Africa", sgp: "Singapore", mys: "Malaysia", tha: "Thailand",
  phl: "Philippines", are: "UAE", sau: "Saudi Arabia", pak: "Pakistan", bgd: "Bangladesh",
  nga: "Nigeria", egy: "Egypt", ken: "Kenya", gha: "Ghana", arg: "Argentina",
  col: "Colombia", chl: "Chile", per: "Peru", ven: "Venezuela", ukr: "Ukraine",
  rou: "Romania", cze: "Czech Republic", hun: "Hungary", grc: "Greece", isr: "Israel",
  hkg: "Hong Kong", twn: "Taiwan", vnm: "Vietnam", lka: "Sri Lanka",
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const parseScRow = (row: any) => ({
  clicks: row?.clicks ?? 0,
  impressions: row?.impressions ?? 0,
  ctr: row?.ctr ?? 0,
  position: row?.position ?? 0,
});

/* ─── GA Custom Dimensions & Funnel Helpers ──────────────────────────────── */

const CONDITION_DIMENSION = "customEvent:branch_corporate_id";

async function getCustomEventDimensions(
  propertyId: string,
  token: string,
): Promise<{ apiName: string; displayName: string }[]> {
  const res = await fetch(`${GA_API_BASE}/properties/${propertyId}/metadata`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { dimensions?: { apiName: string; displayName?: string }[] };
  const dims = json.dimensions ?? [];
  return dims
    .filter((d) => d.apiName?.startsWith("customEvent:"))
    .map((d) => ({
      apiName: d.apiName,
      displayName: d.displayName ?? d.apiName.replace("customEvent:", ""),
    }));
}

async function handleEventParams(
  propertyId: string,
  token: string,
  startDate: string,
  eventName: string,
  conditionName?: string,
): Promise<Response> {
  const customDims = await getCustomEventDimensions(propertyId, token);

  if (customDims.length === 0) {
    return Response.json(
      { rows: [], message: "No custom event parameters found for this property" },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" } },
    );
  }

  const buildDimensionFilter = () => {
    const eventFilter = {
      filter: {
        fieldName: "eventName",
        stringFilter: { matchType: "EXACT" as const, value: eventName },
      },
    };
    if (!conditionName) return eventFilter;
    return {
      andGroup: {
        expressions: [
          eventFilter,
          {
            filter: {
              fieldName: "customEvent:condition_name",
              stringFilter: { matchType: "EXACT" as const, value: conditionName },
            },
          },
        ],
      },
    };
  };

  const BATCH_SIZE = 5;
  const settled: PromiseSettledResult<unknown>[] = [];
  for (let i = 0; i < customDims.length; i += BATCH_SIZE) {
    const batch = customDims.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((dim) =>
        gaReport(propertyId, token, {
          dateRanges: [{ startDate, endDate: "today" }],
          dimensions: [{ name: dim.apiName }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: buildDimensionFilter(),
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: 20,
        }),
      ),
    );
    settled.push(...results);
    if (i + BATCH_SIZE < customDims.length)
      await new Promise((r) => setTimeout(r, 200));
  }

  type GARow = {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  };
  const rows: { paramKey: string; paramValue: string; count: number }[] = [];

  settled.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    const data = (result.value as { rows?: GARow[] }).rows ?? [];
    const paramKey = customDims[i]?.displayName;
    if (!paramKey) return;
    for (const row of data) {
      const paramValue = row.dimensionValues?.[0]?.value ?? "(not set)";
      if (paramValue === "(not set)") continue;
      const count = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
      if (count > 0) rows.push({ paramKey, paramValue, count });
    }
  });

  rows.sort((a, b) => b.count - a.count);

  return Response.json(
    { rows },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" } },
  );
}

async function handleConditionValues(
  propertyId: string,
  token: string,
  startDate: string,
): Promise<Response> {
  const data = await gaReport(propertyId, token, {
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: CONDITION_DIMENSION }],
    metrics: [{ name: "eventCount" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 100,
  });

  type GARow = { dimensionValues?: { value?: string }[] };
  const values: string[] = ((data as { rows?: GARow[] }).rows ?? [])
    .map((r) => r.dimensionValues?.[0]?.value ?? "")
    .filter((v) => v && v !== "(not set)");

  return Response.json(
    { values },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" } },
  );
}

async function handleFunnelConditionValues(
  propertyId: string,
  token: string,
  startDate: string,
): Promise<Response> {
  const data = await gaReport(propertyId, token, {
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "customEvent:condition_name" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: {
          values: [
            "condition_viewed",
            "eligibility_checked",
            "start_assessment_clicked",
            "questionnaire_flow_step",
          ],
        },
      },
    },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 100,
  });

  type GARow = { dimensionValues?: { value?: string }[] };
  const values: string[] = ((data as { rows?: GARow[] }).rows ?? [])
    .map((r) => r.dimensionValues?.[0]?.value ?? "")
    .filter((v) => v && v !== "(not set)");

  return Response.json(
    { values },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" } },
  );
}

async function handleQfsByFlow(
  propertyId: string,
  token: string,
  startDate: string,
  conditionName?: string,
): Promise<Response> {
  const eventFilter = {
    filter: {
      fieldName: "eventName",
      stringFilter: { matchType: "EXACT" as const, value: "questionnaire_flow_step" },
    },
  };
  const dimensionFilter = conditionName
    ? {
        andGroup: {
          expressions: [
            eventFilter,
            {
              filter: {
                fieldName: "customEvent:condition_name",
                stringFilter: { matchType: "EXACT" as const, value: conditionName },
              },
            },
          ],
        },
      }
    : eventFilter;

  const data = await gaReport(propertyId, token, {
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [
      { name: "customEvent:step" },
      { name: "customEvent:user_journey_flow" },
    ],
    metrics: [{ name: "eventCount" }],
    dimensionFilter,
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 100,
  });

  type GARow = {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  };
  const rows = ((data as { rows?: GARow[] }).rows ?? [])
    .map((r) => ({
      step: r.dimensionValues?.[0]?.value ?? "",
      flow: r.dimensionValues?.[1]?.value ?? "",
      count: parseInt(r.metricValues?.[0]?.value ?? "0", 10),
    }))
    .filter((r) => r.step && r.flow && r.count > 0);

  return Response.json(
    { rows },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" } },
  );
}

async function handleEventCounts(
  propertyId: string,
  token: string,
  startDate: string,
  eventNames: string[],
  conditionName?: string,
): Promise<Response> {
  const eventFilter = {
    filter: {
      fieldName: "eventName",
      inListFilter: { values: eventNames },
    },
  };
  const dimensionFilter = conditionName
    ? {
        andGroup: {
          expressions: [
            eventFilter,
            {
              filter: {
                fieldName: "customEvent:condition_name",
                stringFilter: { matchType: "EXACT" as const, value: conditionName },
              },
            },
          ],
        },
      }
    : eventFilter;

  const data = await gaReport(propertyId, token, {
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter,
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
  });

  type GARow = {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  };
  const rows = ((data as { rows?: GARow[] }).rows ?? []).map((row) => ({
    name: row.dimensionValues?.[0]?.value ?? "",
    count: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
  }));

  return Response.json(
    { rows },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" } },
  );
}

async function handleConditionEvents(
  propertyId: string,
  token: string,
  startDate: string,
  conditionValue: string,
): Promise<Response> {
  const data = await gaReport(propertyId, token, {
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dimensionFilter: {
      filter: {
        fieldName: CONDITION_DIMENSION,
        stringFilter: { matchType: "EXACT", value: conditionValue },
      },
    },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 15,
  });

  type GARow = {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  };
  const rows = ((data as { rows?: GARow[] }).rows ?? []).map((row) => ({
    name: row.dimensionValues?.[0]?.value ?? "",
    count: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    usersCount: parseInt(row.metricValues?.[1]?.value ?? "0", 10),
  }));

  return Response.json(
    { rows },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" } },
  );
}

const CONDITION_EVENT_NAMES = [
  "condition_viewed",
  "eligibility_checked",
  "start_assessment_clicked",
  "questionnaire_flow_step",
];

const PRODUCT_EVENT_NAMES = [
  "product_viewed",
  "get_treatment_clicked",
  "product_selected",
  "questionnaire_pm",
  "cart_viewed",
  "cart_auth_completed",
  "checkout_started",
  "order_success",
];

type ConditionEventKey =
  | "condition_viewed"
  | "eligibility_checked"
  | "start_assessment_clicked"
  | "questionnaire_flow_step";

type ProductEventKey =
  | "product_viewed"
  | "get_treatment_clicked"
  | "product_selected"
  | "questionnaire_pm"
  | "cart_viewed"
  | "cart_auth_completed"
  | "checkout_started"
  | "order_success";

interface ConditionStat {
  name: string;
  total: number;
  condition_viewed: number;
  eligibility_checked: number;
  start_assessment_clicked: number;
  questionnaire_flow_step: number;
}

interface ProductStat {
  name: string;
  total: number;
  product_viewed: number;
  get_treatment_clicked: number;
  product_selected: number;
  questionnaire_pm: number;
  cart_viewed: number;
  cart_auth_completed: number;
  checkout_started: number;
  order_success: number;
}

async function handleTopEntities(
  propertyId: string,
  token: string,
  startDate: string,
  conditionFilter?: string,
  productFilter?: string,
): Promise<Response> {
  const buildFilter = (
    eventNames: string[],
    conditionVal?: string,
    productVal?: string,
  ) => {
    const expressions: Record<string, unknown>[] = [
      {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: eventNames },
        },
      },
    ];
    if (conditionVal) {
      expressions.push({
        filter: {
          fieldName: "customEvent:condition_name",
          stringFilter: { matchType: "EXACT" as const, value: conditionVal },
        },
      });
    }
    if (productVal) {
      expressions.push({
        filter: {
          fieldName: "customEvent:product_name",
          stringFilter: { matchType: "EXACT" as const, value: productVal },
        },
      });
    }
    if (expressions.length === 1) return expressions[0];
    return { andGroup: { expressions } };
  };

  const [conditionRes, productRes] = await Promise.allSettled([
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [
        { name: "eventName" },
        { name: "customEvent:condition_name" },
      ],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: buildFilter(
        CONDITION_EVENT_NAMES,
        conditionFilter,
        productFilter,
      ),
      limit: 5000,
    }),
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [
        { name: "eventName" },
        { name: "customEvent:product_name" },
      ],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: buildFilter(
        PRODUCT_EVENT_NAMES,
        conditionFilter,
        productFilter,
      ),
      limit: 5000,
    }),
  ]);

  type GARow = {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  };

  const conditionsMap = new Map<string, ConditionStat>();
  if (conditionRes.status === "fulfilled") {
    const rows = (conditionRes.value as { rows?: GARow[] }).rows ?? [];
    for (const row of rows) {
      const eventName = row.dimensionValues?.[0]?.value ?? "";
      const entityName = row.dimensionValues?.[1]?.value ?? "";
      if (!entityName || entityName === "(not set)") continue;
      const count = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
      if (count <= 0) continue;
      let stat = conditionsMap.get(entityName);
      if (!stat) {
        stat = {
          name: entityName,
          total: 0,
          condition_viewed: 0,
          eligibility_checked: 0,
          start_assessment_clicked: 0,
          questionnaire_flow_step: 0,
        };
        conditionsMap.set(entityName, stat);
      }
      if (
        eventName === "condition_viewed" ||
        eventName === "eligibility_checked" ||
        eventName === "start_assessment_clicked" ||
        eventName === "questionnaire_flow_step"
      ) {
        stat[eventName as ConditionEventKey] += count;
        stat.total += count;
      }
    }
  }

  const productsMap = new Map<string, ProductStat>();
  if (productRes.status === "fulfilled") {
    const rows = (productRes.value as { rows?: GARow[] }).rows ?? [];
    for (const row of rows) {
      const eventName = row.dimensionValues?.[0]?.value ?? "";
      const entityName = row.dimensionValues?.[1]?.value ?? "";
      if (!entityName || entityName === "(not set)") continue;
      const count = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
      if (count <= 0) continue;
      let stat = productsMap.get(entityName);
      if (!stat) {
        stat = {
          name: entityName,
          total: 0,
          product_viewed: 0,
          get_treatment_clicked: 0,
          product_selected: 0,
          questionnaire_pm: 0,
          cart_viewed: 0,
          cart_auth_completed: 0,
          checkout_started: 0,
          order_success: 0,
        };
        productsMap.set(entityName, stat);
      }
      if (
        eventName === "product_viewed" ||
        eventName === "get_treatment_clicked" ||
        eventName === "product_selected" ||
        eventName === "questionnaire_pm" ||
        eventName === "cart_viewed" ||
        eventName === "cart_auth_completed" ||
        eventName === "checkout_started" ||
        eventName === "order_success"
      ) {
        stat[eventName as ProductEventKey] += count;
        stat.total += count;
      }
    }
  }

  const conditions = Array.from(conditionsMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 25);
  const products = Array.from(productsMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 25);

  return Response.json(
    {
      conditions,
      products,
      errors: {
        conditions:
          conditionRes.status === "rejected"
            ? String((conditionRes as PromiseRejectedResult).reason)
            : null,
        products:
          productRes.status === "rejected"
            ? String((productRes as PromiseRejectedResult).reason)
            : null,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30",
      },
    },
  );
}

/* ─── Standard GA4 Multi-Report Handler ──────────────────────────────────── */

async function handleStandardGaReports(
  propertyId: string,
  token: string,
  startDate: string,
): Promise<Response> {
  const settled = await Promise.allSettled([
    // 0. Overview metrics
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      metrics: [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
        { name: "screenPageViewsPerSession" },
        { name: "eventsPerSession" },
      ],
    }),
    // 1. Time series by date
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    }),
    // 2. Hourly traffic (today only)
    gaReport(propertyId, token, {
      dateRanges: [{ startDate: "today", endDate: "today" }],
      dimensions: [{ name: "hour" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "hour" }, desc: false }],
    }),
    // 3. Top pages
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    }),
    // 4. Top landing pages
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "landingPage" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "bounceRate" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    // 5. Device category
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    }),
    // 6. Browser breakdown
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "browser" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),
    // 7. Operating system
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "operatingSystem" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),
    // 8. Top countries
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
      limit: 10,
    }),
    // 9. Top cities
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "city" }, { name: "country" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
      limit: 10,
    }),
    // 10. Traffic sources
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    // 11. Channel grouping
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "engagementRate" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    // 12. New vs returning users
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "newVsReturning" }],
      metrics: [{ name: "totalUsers" }],
    }),
    // 13. Top events
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 15,
    }),
    // 14. Top referrers
    gaReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "pageReferrer" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    // 15. Real-time active users (last 30 min)
    gaRealtimeReport(propertyId, token, {
      metrics: [{ name: "activeUsers" }],
    }),
  ]);

  // If the overview query failed (e.g. permission denied, invalid property ID),
  // return the error to the client instead of swallowing it with empty objects.
  if (settled[0].status === "rejected") {
    const reason = settled[0].reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error("[pharmacy-analytics:server] GA overview query failed:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }

  const ok = (i: number) => {
    const s = settled[i];
    return s && s.status === "fulfilled"
      ? (s as PromiseFulfilledResult<Record<string, unknown>>).value
      : {};
  };

  return Response.json(
    {
      activeUsers: ok(15),
      overview: ok(0),
      timeSeries: ok(1),
      hourlyToday: ok(2),
      topPages: ok(3),
      landingPages: ok(4),
      devices: ok(5),
      browsers: ok(6),
      operatingSystems: ok(7),
      countries: ok(8),
      cities: ok(9),
      trafficSources: ok(10),
      channels: ok(11),
      newVsReturning: ok(12),
      topEvents: ok(13),
      referrers: ok(14),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    },
  );
}

/* ─── Search Console Query Handler ───────────────────────────────────────── */

async function handleSearchConsoleReports(
  siteUrl: string,
  token: string,
  days: number,
): Promise<Response> {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  const base = { startDate, endDate };

  const settled = await Promise.allSettled([
    scQuery(siteUrl, token, { ...base, rowLimit: 1 }),
    scQuery(siteUrl, token, { ...base, dimensions: ["query"], rowLimit: 25 }),
    scQuery(siteUrl, token, { ...base, dimensions: ["page"], rowLimit: 25 }),
    scQuery(siteUrl, token, { ...base, dimensions: ["date"], rowLimit: 500 }),
    scQuery(siteUrl, token, { ...base, dimensions: ["country"], rowLimit: 25 }),
    scQuery(siteUrl, token, { ...base, dimensions: ["device"], rowLimit: 10 }),
    scQuery(siteUrl, token, { ...base, dimensions: ["searchAppearance"], rowLimit: 25 }),
    fetchSitemaps(siteUrl, token),
  ]);

  const ok = (i: number) => {
    const s = settled[i];
    return s?.status === "fulfilled"
      ? (s as PromiseFulfilledResult<Record<string, unknown>>).value
      : {};
  };

  const overviewRaw = ok(0) as any;
  const queriesRaw = ok(1) as any;
  const pagesRaw = ok(2) as any;
  const datesRaw = ok(3) as any;
  const countriesRaw = ok(4) as any;
  const devicesRaw = ok(5) as any;
  const searchAppRaw = ok(6) as any;
  const sitemapsRaw = ok(7) as any;

  const sitemaps = (sitemapsRaw?.sitemap ?? []).map((s: any) => ({
    path: s.path ?? "",
    lastSubmitted: s.lastSubmitted ?? "",
    lastDownloaded: s.lastDownloaded ?? "",
    isPending: s.isPending ?? false,
    warnings: parseInt(s.warnings ?? "0", 10),
    errors: parseInt(s.errors ?? "0", 10),
    contents: (s.contents ?? []).map((c: any) => ({
      type: c.type ?? "",
      submitted: parseInt(c.submitted ?? "0", 10),
      indexed: parseInt(c.indexed ?? "0", 10),
    })),
  }));

  return Response.json(
    {
      overview: overviewRaw?.rows?.[0]
        ? parseScRow(overviewRaw.rows[0])
        : { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      queries: (queriesRaw?.rows ?? []).map((row: any) => ({
        query: row.keys?.[0] ?? "",
        ...parseScRow(row),
      })),
      pages: (pagesRaw?.rows ?? []).map((row: any) => ({
        page: row.keys?.[0] ?? "",
        ...parseScRow(row),
      })),
      timeSeries: (datesRaw?.rows ?? []).map((row: any) => ({
        date: row.keys?.[0] ?? "",
        ...parseScRow(row),
      })),
      countries: (countriesRaw?.rows ?? []).map((row: any) => ({
        country: countryName(row.keys?.[0] ?? ""),
        countryCode: (row.keys?.[0] ?? "").toUpperCase(),
        ...parseScRow(row),
      })),
      devices: (devicesRaw?.rows ?? []).map((row: any) => ({
        device: row.keys?.[0] ?? "",
        ...parseScRow(row),
      })),
      searchAppearance: (searchAppRaw?.rows ?? []).map((row: any) => ({
        appearance: row.keys?.[0] ?? "",
        ...parseScRow(row),
      })),
      sitemaps,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    },
  );
}

/* ─── Unified Route Handler Factory ──────────────────────────────────────── */

/**
 * Creates Next.js App Router GET and POST handlers for Google Analytics 4
 * and Google Search Console.
 */
export function createAnalyticsApiHandler(config?: AnalyticsServerConfig) {
  const getHandler = async (request: Request): Promise<Response> => {
    try {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      const mode = searchParams.get("mode") || searchParams.get("type");
      const dateRange = searchParams.get("range") || "30";
      const startDate = `${dateRange}daysAgo`;

      const gaPropertyId = config?.gaPropertyId || process.env.GA_PROPERTY_ID;
      const scSiteUrl =
        config?.searchConsoleSiteUrl ||
        process.env.SEARCH_CONSOLE_SITE_URL ||
        process.env.NEXT_PUBLIC_SEARCH_CONSOLE_SITE_URL;

      const gaClientEmail = config?.gaServiceAccountEmail || process.env.GA_SERVICE_ACCOUNT_EMAIL;
      const gaPrivateKey = config?.gaPrivateKey || process.env.GA_PRIVATE_KEY;

      const scClientEmail =
        config?.searchConsoleServiceAccountEmail ||
        process.env.SEARCH_CONSOLE_SERVICE_ACCOUNT_EMAIL ||
        gaClientEmail;
      const scPrivateKey =
        config?.searchConsolePrivateKey ||
        process.env.SEARCH_CONSOLE_PRIVATE_KEY ||
        gaPrivateKey;

      const isSearchConsole =
        mode === "search-console" ||
        url.pathname.endsWith("/search-console") ||
        url.pathname.endsWith("/search-console/");

      // ── 1. Search Console Mode ──
      if (isSearchConsole) {
        if (!scSiteUrl) {
          return Response.json(
            { error: "SEARCH_CONSOLE_SITE_URL is not configured. Please set SEARCH_CONSOLE_SITE_URL in your environment or plugin config." },
            { status: 500 },
          );
        }
        if (!scClientEmail || !scPrivateKey) {
          return Response.json(
            { error: "Google service account credentials missing for Search Console. Please set GA_SERVICE_ACCOUNT_EMAIL or SEARCH_CONSOLE_SERVICE_ACCOUNT_EMAIL." },
            { status: 500 },
          );
        }
        const scToken = await getAccessToken(SC_SCOPE, scClientEmail, scPrivateKey);
        const days = parseInt(dateRange, 10) || 28;
        return handleSearchConsoleReports(scSiteUrl, scToken, days);
      }

      // ── 2. Google Analytics & Custom Dimensions Modes ──
      if (!gaPropertyId) {
        return Response.json(
          { error: "GA_PROPERTY_ID not configured" },
          { status: 500 },
        );
      }
      if (!gaClientEmail || !gaPrivateKey) {
        return Response.json(
          { error: "Google service account credentials missing for Google Analytics. Please set GA_SERVICE_ACCOUNT_EMAIL and GA_PRIVATE_KEY." },
          { status: 500 },
        );
      }

      const gaToken = await getAccessToken(GA_SCOPE, gaClientEmail, gaPrivateKey);

      if (mode === "event-params") {
        const eventName = searchParams.get("event");
        if (!eventName) {
          return Response.json(
            { error: "Missing 'event' query parameter" },
            { status: 400 },
          );
        }
        const condition = searchParams.get("condition") || undefined;
        return handleEventParams(gaPropertyId, gaToken, startDate, eventName, condition);
      }

      if (mode === "condition-values") {
        return handleConditionValues(gaPropertyId, gaToken, startDate);
      }

      if (mode === "funnel-condition-values") {
        return handleFunnelConditionValues(gaPropertyId, gaToken, startDate);
      }

      if (mode === "condition-events") {
        const conditionValue = searchParams.get("value");
        if (!conditionValue) {
          return Response.json(
            { error: "Missing 'value' query parameter" },
            { status: 400 },
          );
        }
        return handleConditionEvents(gaPropertyId, gaToken, startDate, conditionValue);
      }

      if (mode === "qfs-by-flow") {
        const condition = searchParams.get("condition") || undefined;
        return handleQfsByFlow(gaPropertyId, gaToken, startDate, condition);
      }

      if (mode === "top-entities") {
        const conditionFilter = searchParams.get("condition") || undefined;
        const productFilter = searchParams.get("product") || undefined;
        return handleTopEntities(
          gaPropertyId,
          gaToken,
          startDate,
          conditionFilter,
          productFilter,
        );
      }

      if (mode === "event-count") {
        const eventsParam = searchParams.get("events");
        if (!eventsParam) {
          return Response.json(
            { error: "Missing 'events' query parameter" },
            { status: 400 },
          );
        }
        const condition = searchParams.get("condition") || undefined;
        return handleEventCounts(
          gaPropertyId,
          gaToken,
          startDate,
          eventsParam.split(","),
          condition,
        );
      }

      // ── 3. Default: Full Standard GA4 Bundle ──
      return handleStandardGaReports(gaPropertyId, gaToken, startDate);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[pharmacy-analytics:server] Unhandled GET error:", message);
      return Response.json({ error: message }, { status: 500 });
    }
  };

  const postHandler = async (request: Request): Promise<Response> => {
    try {
      const scSiteUrl =
        config?.searchConsoleSiteUrl ||
        process.env.SEARCH_CONSOLE_SITE_URL ||
        process.env.NEXT_PUBLIC_SEARCH_CONSOLE_SITE_URL;

      if (!scSiteUrl) {
        return Response.json(
          { error: "SEARCH_CONSOLE_SITE_URL not configured" },
          { status: 500 },
        );
      }

      const clientEmail =
        config?.searchConsoleServiceAccountEmail ||
        process.env.SEARCH_CONSOLE_SERVICE_ACCOUNT_EMAIL ||
        config?.gaServiceAccountEmail ||
        process.env.GA_SERVICE_ACCOUNT_EMAIL;
      const privateKey =
        config?.searchConsolePrivateKey ||
        process.env.SEARCH_CONSOLE_PRIVATE_KEY ||
        config?.gaPrivateKey ||
        process.env.GA_PRIVATE_KEY;

      const body = (await request.json().catch(() => ({}))) as { sitemapUrl?: string };
      const feedpath = body?.sitemapUrl;
      if (!feedpath || typeof feedpath !== "string") {
        return Response.json(
          { error: "Missing sitemapUrl in request body" },
          { status: 400 },
        );
      }

      const token = await getAccessToken(SC_SCOPE, clientEmail, privateKey);
      await submitSitemap(scSiteUrl, feedpath, token);

      return Response.json({
        success: true,
        message: `Sitemap submitted: ${feedpath}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[pharmacy-analytics:server] Unhandled POST error:", msg);
      return Response.json({ error: msg }, { status: 500 });
    }
  };

  // CORS is opt-in: without `corsOrigin` no headers are sent, so the route stays same-origin only.
  const corsHeaders = (): Record<string, string> =>
    config?.corsOrigin
      ? {
          "Access-Control-Allow-Origin": config.corsOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        }
      : {};

  const optionsHandler = async (): Promise<Response> =>
    new Response(null, { status: 204, headers: corsHeaders() });

  const withCors =
    (handler: (req: Request) => Promise<Response>) =>
    async (req: Request): Promise<Response> => {
      let res: Response;
      try {
        res = await handler(req);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res = Response.json({ error: msg }, { status: 500 });
      }
      const extra = corsHeaders();
      if (!Object.keys(extra).length) return res;
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(extra)) headers.set(k, v);
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    };

  return {
    GET: withCors(getHandler),
    POST: withCors(postHandler),
    OPTIONS: optionsHandler,
  };
}

/* ─── Default Exported Route Handlers ────────────────────────────────────── */

const defaultHandlers = createAnalyticsApiHandler();
export const GET = defaultHandlers.GET;
export const POST = defaultHandlers.POST;
export const OPTIONS = defaultHandlers.OPTIONS;
