import { useMemo } from "react";
import { useGlobalWebsocket } from "../../GlobalWebsocket";
import type { MatchSnapshot } from "../../types";
import { mapSnapshotToLiveLevelTeams } from "../repository/remote";

export function useLivePlayerLevelsController() {
  const { status, message, url } = useGlobalWebsocket<MatchSnapshot>("ingame");
  const teams = useMemo(() => mapSnapshotToLiveLevelTeams(message?.data), [message]);

  return {
    status,
    url,
    error: message?.error || "",
    leftPlayers: teams.leftPlayers,
    rightPlayers: teams.rightPlayers
  };
}
