import { useEffect, useMemo, useState } from "react";
import type { MatchSnapshot } from "../../types";
import { getControlSnapshot, saveRoleAssignments } from "../repository/remote";

const roleOptions = ["exp", "mid", "roam", "jungle", "gold"];

export function useControlController() {
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    getControlSnapshot()
      .then((data) => {
        setSnapshot(data);
        const initial: Record<string, string> = {};
        data.all_players.forEach((player) => {
          if (player.roleid && player.role && player.role !== "unassigned") {
            initial[player.roleid] = player.role;
          }
        });
        setAssignments(initial);
      })
      .catch((error: Error) => setStatus(error.message));
  }, []);

  const players = useMemo(() => snapshot?.all_players.filter((player) => player.heroid) || [], [snapshot]);

  const setRole = (roleid: string, role: string) => {
    setAssignments((current) => ({ ...current, [roleid]: role }));
  };

  const save = async () => {
    setStatus("Saving roles...");
    try {
      await saveRoleAssignments(assignments);
      setStatus("Roles saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save roles.");
    }
  };

  return { snapshot, players, assignments, roleOptions, setRole, save, status };
}
