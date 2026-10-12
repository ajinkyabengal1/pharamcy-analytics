"use client";

import { useEffect } from "react";
import mixpanel from "mixpanel-browser";

export interface MixpanelInitProps {
  token?: string | null;
}

export function MixpanelInit({ token }: MixpanelInitProps = {}) {
  useEffect(() => {
    const activeToken =
      token || (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MIX_PANEL_TOKEN : undefined);
    if (!activeToken) return;

    mixpanel.init(activeToken, {
      persistence: "localStorage",
      autocapture: false,
      track_pageview: false,
      record_sessions_percent: 0,
    });
  }, [token]);

  return null;
}

export default MixpanelInit;
