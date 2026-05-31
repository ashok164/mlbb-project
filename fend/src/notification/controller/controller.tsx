import { useEffect, useMemo, useState } from "react";
import { useGlobalWebsocket } from "../../GlobalWebsocket";
import type { MatchSnapshot } from "../../types";
import { getCurrentSnapshot } from "../repository/remote";

export function useNotificationController() {
  const [fallbackSnapshot, setFallbackSnapshot] = useState<MatchSnapshot | null>(null);
  const [fallbackError, setFallbackError] = useState("");
  const { status, message, url } = useGlobalWebsocket<MatchSnapshot>("data");

  useEffect(() => {
    getCurrentSnapshot()
      .then(setFallbackSnapshot)
      .catch((error: Error) => setFallbackError(error.message));
  }, []);

  const snapshot = useMemo(() => {
    if (message?.ok && message.data) return message.data;
    return fallbackSnapshot;
  }, [fallbackSnapshot, message]);

  return {
    status,
    url,
    snapshot,
    error: message?.error || fallbackError,
    updatedAt: message?.updated_at || ""
  };
}
