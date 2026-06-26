import { useEffect, useMemo, useState } from "react";
import { useGlobalWebsocket } from "../../GlobalWebsocket";
import type { MatchSnapshot } from "../../types";
import { getNextRole, getRequestedRole, mapSnapshotToRoleCameraDuel, ROLE_ORDER } from "../repository/remote";

export function useRoleCameraDuelController() {
  const { status, message, url } = useGlobalWebsocket<MatchSnapshot>("ingame");
  const pinnedRole = useMemo(() => getRequestedRole(window.location.search), []);
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    if (pinnedRole) return;

    const intervalId = window.setInterval(() => {
      setRoleIndex((current) => (current + 1) % ROLE_ORDER.length);
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pinnedRole]);

  const role = pinnedRole || ROLE_ORDER[roleIndex];
  const duel = useMemo(() => mapSnapshotToRoleCameraDuel(message?.data, role), [message, role]);
  const nextRole = useMemo(() => getNextRole(role), [role]);
  const nextDuel = useMemo(() => mapSnapshotToRoleCameraDuel(message?.data, nextRole), [message, nextRole]);

  return {
    status,
    url,
    error: message?.error || "",
    role: duel.role,
    leftPlayer: duel.leftPlayer,
    rightPlayer: duel.rightPlayer,
    preloadLeftPlayer: nextDuel.leftPlayer,
    preloadRightPlayer: nextDuel.rightPlayer
  };
}
