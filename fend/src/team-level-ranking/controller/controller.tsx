import { useMemo } from "react";
import { useGlobalWebsocket } from "../../GlobalWebsocket";
import type { MatchSnapshot } from "../../types";
import { mapSnapshotToTeamLevelRanking } from "../repository/remote";

export function useTeamLevelRankingController() {
  const { status, message, url } = useGlobalWebsocket<MatchSnapshot>("ingame");
  const ranking = useMemo(() => mapSnapshotToTeamLevelRanking(message?.data), [message]);

  return {
    status,
    url,
    error: message?.error || "",
    players: ranking.players
  };
}
