"use client";

import { useEffect } from "react";
import { trackMetaEventOnce } from "@/lib/marketing-attribution";

export default function MetaCheckoutConversion({ sessionId, value, currency }: {
  sessionId: string;
  value: number;
  currency: string;
}) {
  useEffect(() => {
    trackMetaEventOnce("purchase:" + sessionId, "Purchase", {
      value,
      currency: currency.toUpperCase(),
      content_name: "Diamond Profile subscription",
    });
    trackMetaEventOnce("subscribe:" + sessionId, "Subscribe", {
      value,
      currency: currency.toUpperCase(),
    });
  }, [currency, sessionId, value]);

  return null;
}
