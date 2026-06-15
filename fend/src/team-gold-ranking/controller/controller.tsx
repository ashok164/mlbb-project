import { useMemo } from "react";
import { useGlobalWebsocket } from "../../GlobalWebsocket";
import type { MatchSnapshot } from "../../types";
import { mapSnapshotToTeamGoldRanking } from "../repository/remote";

export function useTeamGoldRankingController() {
  const { status, message, url } = useGlobalWebsocket<MatchSnapshot>("ingame");
  const ranking = useMemo(() => mapSnapshotToTeamGoldRanking(message?.data), [message]);

  return {
    status,
    url,
    error: message?.error || "",
    players: ranking.players
  };
}
