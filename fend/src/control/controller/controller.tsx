import { useEffect, useMemo, useState } from "react";
import type { MatchSnapshot, Player, RoleAssignmentMap } from "../../types";
import { getControlSnapshot, saveRoleAssignments } from "../repository/remote";

const roleOptions = ["exp", "mid", "roam", "jungle", "gold"];

function teamOrder(snapshot: MatchSnapshot) {
  return [
    ...snapshot.left_team.players.filter((player) => player.heroid),
    ...snapshot.right_team.players.filter((player) => player.heroid)
  ];
}

function resequenceByTeam(players: Player[], snapshot: MatchSnapshot) {
  const leftIds = new Set(snapshot.left_team.players.map((player) => String(player.roleid)));
  const left = players.filter((player) => leftIds.has(String(player.roleid)));
  const right = players.filter((player) => !leftIds.has(String(player.roleid)));
  return [
    ...left.map((player, index) => ({ player, sequence_number: index + 1 })),
    ...right.map((player, index) => ({ player, sequence_number: index + 1 }))
  ];
}

export function useControlController() {
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [assignments, setAssignments] = useState<RoleAssignmentMap>({});
  const [orderedPlayers, setOrderedPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getControlSnapshot()
      .then((data) => {
        setSnapshot(data);
        const activePlayers = teamOrder(data);
        const initial: RoleAssignmentMap = {};
        resequenceByTeam(activePlayers, data).forEach(({ player, sequence_number }) => {
          if (player.roleid && player.role && player.role !== "unassigned") {
            initial[player.roleid] = {
              role: player.role,
              sequence_number: player.sequence_number || sequence_number,
              hero_name: player.assigned_hero_name || "",
              uid: player.uid || player.roleid,
              camera_link: player.camera_link || ""
            };
          }
        });
        setAssignments(initial);
        setOrderedPlayers(activePlayers);
      })
      .catch((error: Error) => setStatus(error.message));
  }, []);

  const players = useMemo(
    () => (orderedPlayers.length ? orderedPlayers : snapshot?.all_players.filter((player) => player.heroid) || []),
    [orderedPlayers, snapshot]
  );

  const sequenceByRoleid = useMemo(() => {
    if (!snapshot) return {};
    return resequenceByTeam(players, snapshot).reduce<Record<string, number>>((current, item) => {
      current[String(item.player.roleid)] = item.sequence_number;
      return current;
    }, {});
  }, [players, snapshot]);

  const setRole = (roleid: string, role: string) => {
    setAssignments((current) => ({
      ...current,
        [roleid]: {
          role,
          sequence_number: current[roleid]?.sequence_number || players.findIndex((player) => player.roleid === roleid) + 1,
          hero_name: current[roleid]?.hero_name || "",
          uid: current[roleid]?.uid || roleid,
          camera_link: current[roleid]?.camera_link || players.find((player) => player.roleid === roleid)?.camera_link || ""
        }
      }));
  };

  const setHeroName = (roleid: string, hero_name: string) => {
    setAssignments((current) => ({
      ...current,
        [roleid]: {
          role: current[roleid]?.role || players.find((player) => player.roleid === roleid)?.role || "",
          sequence_number: current[roleid]?.sequence_number || players.findIndex((player) => player.roleid === roleid) + 1,
          hero_name,
          uid: current[roleid]?.uid || roleid,
          camera_link: current[roleid]?.camera_link || players.find((player) => player.roleid === roleid)?.camera_link || ""
        }
      }));
  };

  const setCameraLink = (roleid: string, camera_link: string) => {
    setAssignments((current) => ({
      ...current,
      [roleid]: {
        role: current[roleid]?.role || players.find((player) => player.roleid === roleid)?.role || "",
        sequence_number: current[roleid]?.sequence_number || players.findIndex((player) => player.roleid === roleid) + 1,
        hero_name: current[roleid]?.hero_name || players.find((player) => player.roleid === roleid)?.assigned_hero_name || "",
        uid: current[roleid]?.uid || roleid,
        camera_link
      }
    }));
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= players.length) return;
    const nextPlayers = [...players];
    const [moved] = nextPlayers.splice(fromIndex, 1);
    nextPlayers.splice(toIndex, 0, moved);
    setOrderedPlayers(nextPlayers);
    setAssignments((current) => {
      const next = { ...current };
      const sequenced = snapshot ? resequenceByTeam(nextPlayers, snapshot) : nextPlayers.map((player, index) => ({ player, sequence_number: index + 1 }));
      sequenced.forEach(({ player, sequence_number }) => {
        if (!player.roleid) return;
        next[player.roleid] = {
          role: next[player.roleid]?.role || player.role || "",
          sequence_number,
          hero_name: next[player.roleid]?.hero_name || player.assigned_hero_name || "",
          uid: next[player.roleid]?.uid || player.uid || player.roleid,
          camera_link: next[player.roleid]?.camera_link || player.camera_link || ""
        };
      });
      return next;
    });
  };

  const save = async () => {
    setStatus("Saving roles...");
    try {
      const payload = { ...assignments };
      const missingRole = players.some((player) => !payload[player.roleid]?.role && (!player.role || player.role === "unassigned"));
      if (missingRole) {
        setStatus("Please assign a role to every player before saving.");
        return;
      }
      const sequenced = snapshot ? resequenceByTeam(players, snapshot) : players.map((player, index) => ({ player, sequence_number: index + 1 }));
      sequenced.forEach(({ player, sequence_number }) => {
        if (!player.roleid) return;
        payload[player.roleid] = {
          role: payload[player.roleid]?.role || player.role || "",
          sequence_number,
          hero_name: payload[player.roleid]?.hero_name || player.assigned_hero_name || "",
          uid: payload[player.roleid]?.uid || player.uid || player.roleid,
          camera_link: payload[player.roleid]?.camera_link || player.camera_link || ""
        };
      });
      await saveRoleAssignments(payload);
      setStatus("Roles saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save roles.");
    }
  };

  return { snapshot, players, assignments, sequenceByRoleid, roleOptions, setRole, setHeroName, setCameraLink, movePlayer, save, status };
}
