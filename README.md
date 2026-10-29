# @healthya-team/pharmacy-analytics

> **Unified Pharmacy Analytics Platform**  
> Consolidates Google Analytics 4 (GA4), Mixpanel patient funnels, and Google Search Console into a single high-performance library with Next.js App Router handlers and a Sanity Studio dashboard.

---

## 🌟 Key Features

1. **Centralized Tab Switcher (Center of the Page)**
   - **All (Default)**: Consolidated executive overview combining Google Organic Search, visitor metrics, and patient pre-consultation & prescription order conversion funnels. Displays all three groups in the sidebar simultaneously.
   - **Analytics**: Dedicated Google Analytics 4 views (Overview, Traffic, Content, Audience, Geography, Events, Acquisition).
   - **Custom Analytics**: Healthcare journey funnels (Pre-Consult funnel steps, drop-offs, PM Funnel, Conditions & Products overview).
   - **Search Console**: Google organic search performance (Top queries, landing pages, rankings, devices, countries, search appearance, and sitemaps).

2. **Unified Google Cloud Auth**
   - Single Google Service Account (`GA_SERVICE_ACCOUNT_EMAIL` + `GA_PRIVATE_KEY`) signs RS256 JWTs using `jose` with in-memory token caching.
   - Authorizes both **GA4 Data API** (`analytics.readonly`) and **Google Search Console API** (`webmasters`).

3. **Subpath Exports**
   - `@healthya-team/pharmacy-analytics/client`: Consent-aware GA4 script, Mixpanel initializer, route tracking provider, and typed healthcare event trackers.
   - `@healthya-team/pharmacy-analytics/server`: Next.js App Router route handlers serving GA4 and Search Console.
   - `@healthya-team/pharmacy-analytics/studio`: Sanity Studio plugin and standalone `<PharmacyAnalyticsDashboard />` component.

---

## 📦 Installation

In your Next.js and Sanity project:

```bash
# If linking locally or in a pnpm monorepo:
pnpm add @healthya-team/pharmacy-analytics

# Or using relative package reference:
# "dependencies": { "@healthya-team/pharmacy-analytics": "workspace:*" }
```

---

## ⚙️ Environment Configuration

Add the following environment variables to your `.env.local`:

```bash
# ── Google Analytics 4 ──
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_PROPERTY_ID=123456789

# ── Google Search Console ──
SEARCH_CONSOLE_SITE_URL=https://your-pharmacy-website.co.uk

# ── Google Service Account (Shared by GA4 & Search Console) ──
GA_SERVICE_ACCOUNT_EMAIL=pharmacy-analytics-sa@project.iam.gserviceaccount.com
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# ── Mixpanel (Optional / Pre-Consult Funnels) ──
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_project_token
```

> **Note on Permissions:**
> - In **Google Analytics Admin → Property Access Management**, grant your service account email the **Viewer** role.
> - In **Google Search Console → Settings → Users and permissions**, add your service account email with **Full** or **Owner** permission.

---

## 🚀 Usage

### 1. Unified Next.js API Route Handler

Create `app/api/analytics/route.ts` in your Next.js application:

```typescript
// app/api/analytics/route.ts
export { GET, POST } from '@healthya-team/pharmacy-analytics/server'

export const dynamic = 'force-dynamic'
```

*That's it!* This single route automatically handles:
- GA4 multi-reports (`/api/analytics?range=30`)
- GA4 custom dimensions (`?mode=event-params`, `?mode=condition-values`, `?mode=top-entities`)
- Search Console queries (`?mode=search-console&range=28`)
- Search Console sitemap submissions via `POST`

---

### 2. Client-Side Tracking & Providers

Add the tracking provider to your root layout (`app/layout.tsx`):

```tsx
// app/layout.tsx
import {
  AnalyticsProvider,
  GaScript,
  MixpanelInit,
} from '@healthya-team/pharmacy-analytics/client'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <GaScript defaultConsent="denied" />
        <MixpanelInit />
      </head>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  )
}
```

#### Firing Healthcare & Pharmacy Events:

```typescript
import {
  trackConditionViewed,
  trackEligibilityChecked,
  trackStartAssessmentClicked,
  trackQuestionnaireFlowStep,
  trackOrderSuccess,
} from '@healthya-team/pharmacy-analytics/client'

// When a patient views a clinical condition
trackConditionViewed('Weight Loss', 'weight-loss')

// When patient checks eligibility
trackEligibilityChecked({
  conditionName: 'Weight Loss',
  status: 'eligible',
  isNhs: false,
})

// When patient clicks start assessment
trackStartAssessmentClicked('Weight Loss')

// When patient completes questionnaire step
trackQuestionnaireFlowStep({
  step: 'questionnaire_submitted',
  userJourneyFlow: 'appointment_booking',
  conditionName: 'Weight Loss',
})

// When patient completes order
trackOrderSuccess({
  orderId: 'ORD-12345',
  productName: 'Mounjaro 2.5mg',
  conditionName: 'Weight Loss',
  total: 149.00,
})
```

---

### 3. Sanity Studio Dashboard Integration

Add the plugin to your `sanity.config.ts`:

```typescript
// sanity.config.ts
import { defineConfig } from 'sanity'
import { pharmacyAnalyticsPlugin } from '@healthya-team/pharmacy-analytics/studio'

export default defineConfig({
  name: 'default',
  title: 'Pharmacy Studio',
  projectId: 'your-project-id',
  dataset: 'production',
  plugins: [
    pharmacyAnalyticsPlugin({
      apiUrl: '/api/analytics',
      title: 'Pharmacy Analytics',
    }),
  ],
})
```

#### Or use the React component standalone:

```tsx
import { PharmacyAnalyticsDashboard } from '@healthya-team/pharmacy-analytics/studio'

export default function AdminAnalyticsPage() {
  return (
    <PharmacyAnalyticsDashboard
      apiUrl="/api/analytics"
      brandName="Your Pharmacy"
    />
  )
}
```

---

## 🖥️ Dashboard Architecture & Tab Navigation

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [P] Pharmacy Analytics       [ All | Analytics | Custom Analytics | Search Console ]  [7d|14d|30d|90d] [Refresh]│
├─────────────────────────┬──────────────────────────────────────────────────────────────┤
│ ▦ Executive Overview    │  EXECUTIVE SUMMARY BANNER & LIVE ACTIVE VISITORS             │
│                         │                                                              │
│ ▾ GOOGLE ANALYTICS      │  KPIs: Organic Clicks | Impressions | Visitors | Pre-Consult │
│   ▦ Overview            │                                                              │
│   ↗ Traffic             │  [Explore GA4]     [Explore Funnels]    [Explore Search]     │
│   ≡ Content             │                                                              │
│   ◉ Audience            │  CHARTS:                                                     │
│   ⊕ Geography           │  • Google Search Daily Trend (Clicks & Impressions)          │
│   ⚡ Events             │  • Website Visitors & Sessions Daily Trend                   │
│   ⤴ Acquisition         │                                                              │
│                         │  TABLES:                                                     │
│ ▾ CUSTOM ANALYTICS      │  • Top Google Organic Queries (Clicks & Rankings)            │
│   🧬 Overview           │  • Top Visited Pages (Views & Visitors)                      │
│   ⬡ Pre Consult Events  │                                                              │
│   💊 PM Funnel Events   │                                                              │
│                         │                                                              │
│ ▾ SEARCH CONSOLE        │                                                              │
│   ◎ Overview            │                                                              │
│   🔍 Top Queries        │                                                              │
│   📄 Top Pages          │                                                              │
│   🌐 Countries          │                                                              │
│   📱 Devices            │                                                              │
│   ✨ Appearance         │                                                              │
│   🗺️ Sitemaps           │                                                              │
└─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Build & Verification

```bash
# Type check without emitting
pnpm typecheck

# Build ESM & CJS bundles + d.ts files
pnpm build
```

Built with ❤️ by Healthya Engineering Team.
