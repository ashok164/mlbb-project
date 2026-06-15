import { useEffect, useRef, useState } from "react";
import { useGlobalWebsocket } from "../../GlobalWebsocket";
import type { LiveAlertEvent } from "../../types";

const DISPLAY_MS = 4200;

function isObjectiveAlert(item: LiveAlertEvent) {
  return (
    item.trigger === "turtle_spawn" ||
    item.trigger === "lord_spawn"
  );
}

export function useObjectiveNotificationAlertController() {
  const { status, message, url } = useGlobalWebsocket<LiveAlertEvent[]>("live-events");
  const seenIds = useRef(new Set<string>());
  const queue = useRef<LiveAlertEvent[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const [activeAlert, setActiveAlert] = useState<LiveAlertEvent | null>(null);

  useEffect(() => {
    const items = (message?.data || []).filter(isObjectiveAlert);
    const fresh = items.filter((item) => {
      if (seenIds.current.has(item.id)) return false;
      seenIds.current.add(item.id);
      return true;
    });

    if (!fresh.length) return;
    queue.current.push(...fresh);
    if (!activeAlert) flushQueue();
  }, [activeAlert, message]);

  function flushQueue() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const next = queue.current.shift() || null;
    setActiveAlert(next);

    if (!next) return;

    timeoutRef.current = window.setTimeout(() => {
      setActiveAlert(null);
      flushQueue();
    }, DISPLAY_MS);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    status,
    url,
    error: message?.error || "",
    activeAlert
  };
}
