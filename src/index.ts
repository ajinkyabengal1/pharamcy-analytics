/**
 * @healthya-team/pharmacy-analytics
 * Unified Analytics Package for Pharmacy Platforms
 *
 * The root entry is types-only. Browser tracking, route handlers and the Studio dashboard run in
 * different runtimes ("use client" vs server vs Sanity Studio), so import them from a subpath:
 * - '@healthya-team/pharmacy-analytics/client' (Event tracker, Mixpanel, GA scripts, provider)
 * - '@healthya-team/pharmacy-analytics/server' (Next.js route handlers for GA4 & Search Console)
 * - '@healthya-team/pharmacy-analytics/studio' (Sanity Studio plugin & Unified Dashboard)
 */

export type * from './client'
export type * from './server'
export type * from './studio'
