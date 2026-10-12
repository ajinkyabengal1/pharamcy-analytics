import React from "react";
import Script from "next/script";

export interface GaScriptProps {
  measurementId?: string | null;
}

/**
 * Injects the GA4 gtag.js script globally in Next.js layout.
 *
 * Loaded with `beforeInteractive` priority so `gtag` is always available.
 * Consent is initialized as DENIED by default until user accepts cookies.
 */
export function GaScript({ measurementId }: GaScriptProps) {
  const id = measurementId || (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined);

  if (!id) return null;

  return (
    <>
      {/* Load the gtag.js library */}
      <Script
        id="ga4-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="beforeInteractive"
      />

      {/* Bootstrap dataLayer and set default consent to denied */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          // Default consent state — denied until user accepts cookies
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            wait_for_update: 500
          });

          gtag('config', '${id}', {
            send_page_view: false,
          });
        `}
      </Script>
    </>
  );
}

export default GaScript;
