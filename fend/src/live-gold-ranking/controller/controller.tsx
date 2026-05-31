import { useMemo } from "react";
import { useGlobalWebsocket } from "../../GlobalWebsocket";
import type { MatchSnapshot } from "../../types";
import { mapSnapshotToGoldRanking } from "../repository/remote";

export function useLiveGoldRankingController() {
  const { status, message, url } = useGlobalWebsocket<MatchSnapshot>("ingame");
  const players = useMemo(() => mapSnapshotToGoldRanking(message?.data), [message]);

  return {
    status,
    url,
    error: message?.error || "",
    players
  };
}
