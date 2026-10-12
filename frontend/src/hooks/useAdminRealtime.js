"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/config";

const BUSINESS_EVENTS = new Set([
  "booking.created",
  "booking.updated",
  "booking.cancelled",
  "booking.expired",
  "payment.updated",
  "inquiry.created",
  "inquiry.updated",
  "inventory.updated",
]);

/**
 * Subscribe to admin SSE for booking/payment signals.
 * @param {(event: { type: string, [key: string]: unknown }) => void} onEvent
 * @param {{ enabled?: boolean }} [options]
 */
export default function useAdminRealtime(onEvent, { enabled = true } = {}) {
  const onEventRef = useRef(onEvent);
  const [connected, setConnected] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    let source = null;
    let closed = false;
    let retryMs = 1000;
    let retryTimer = null;

    function clearDebounce() {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    }

    function scheduleCallback(payload) {
      clearDebounce();
      debounceRef.current = window.setTimeout(() => {
        onEventRef.current?.(payload);
      }, 300);
    }

    function connect() {
      if (closed) return;
      const url = `${getApiBaseUrl()}/api/admin/realtime/stream`;
      source = new EventSource(url, { withCredentials: true });

      source.onopen = () => {
        setConnected(true);
        retryMs = 1000;
      };

      source.onerror = () => {
        setConnected(false);
        source?.close();
        source = null;
        if (closed) return;
        retryTimer = window.setTimeout(() => {
          retryMs = Math.min(retryMs * 2, 30000);
          connect();
        }, retryMs);
      };

      for (const name of BUSINESS_EVENTS) {
        source.addEventListener(name, (event) => {
          let payload = { type: name };
          try {
            payload = { ...JSON.parse(event.data || "{}"), type: name };
          } catch {
            // keep default
          }
          scheduleCallback(payload);
        });
      }
    }

    connect();

    return () => {
      closed = true;
      setConnected(false);
      clearDebounce();
      if (retryTimer) window.clearTimeout(retryTimer);
      source?.close();
    };
  }, [enabled]);

  return { connected };
}
