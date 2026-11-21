"use client";

import { useEffect } from "react";

/**
 * Keeps asynchronous virtual-account provisioning moving while a user is
 * active. The Vercel Cron job runs daily; this interval triggers one retry
 * pass every 5 minutes during an active session. The endpoint is protected
 * by the user's session, so it cannot be abused by anonymous callers.
 */
export function ProvisioningPoller() {
  useEffect(() => {
    const tick = () => {
      fetch("/api/cron/poll-virtual-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }).catch(() => undefined);
    };
    const initial = setTimeout(tick, 8000);
    const interval = setInterval(tick, 5 * 60 * 1000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);
  return null;
}
