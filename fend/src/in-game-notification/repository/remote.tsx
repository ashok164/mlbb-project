import type { MatchSnapshot, Player } from "../../types";

export type TeamSide = "left" | "right";

export type LevelPlayer = {
  playerId: string;
  playerName: string;
  teamSide: TeamSide;
  role: string;
  heroId: string;
  level: number;
  slot: number;
  equipments: Array<{
    id: string;
  }>;
};

const EQUIPMENT_MAIN_IMAGE_BASE = "/Public/Equipment/Main";
const mainItemFiles = import.meta.glob("../../../Public/Equipment/Main/*.png", {
  eager: true,
  query: "?url",
  import: "default"
});
const mainItems = new Set<string>(
  Object.keys(mainItemFiles)
    .map((path) => path.split("/").pop())
    .filter((fileName): fileName is string => Boolean(fileName))
);

function normalizeRole(role: string) {
  const clean = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  const roleMap: Record<string, string> = {
    exp: "exp",
    explane: "exp",
    xp: "exp",
    gold: "gold",
    goldlane: "gold",
    jungle: "jungle",
    jungler: "jungle",
    jg: "jungle",
    mid: "mid",
    midlane: "mid",
    middle: "mid",
    roam: "roam",
    roamer: "roam",
    support: "roam"
  };

  return roleMap[clean] || "roam";
}

function toLevelPlayer(player: Player, teamSide: TeamSide, slot: number): LevelPlayer {
  return {
    playerId: player.roleid || `${teamSide}-${slot}`,
    playerName: player.name || `Player ${teamSide === "left" ? slot + 1 : slot + 6}`,
    teamSide,
    role: normalizeRole(player.role),
    heroId: String(player.heroid || "").trim(),
    level: Number(player.level) || 0,
    slot,
    equipments: (player.equips || [])
      .map((equipment) => ({ id: String(equipment.id ?? "").trim() }))
      .filter((equipment) => equipment.id && equipment.id !== "blank")
  };
}

export function getMainEquipmentImagePath(itemId: string) {
  return `${EQUIPMENT_MAIN_IMAGE_BASE}/${itemId}.png`;
}

export function isMainEquipmentItem(itemId: string) {
  return mainItems.has(`${itemId}.png`);
}

export function mapSnapshotToLevelPlayers(snapshot?: MatchSnapshot | null) {
  if (!snapshot) return [];

  const left = (snapshot.left_team.players || [])
    .slice(0, 5)
    .map((player, index) => toLevelPlayer(player, "left", index));

  const right = (snapshot.right_team.players || [])
    .slice(0, 5)
    .map((player, index) => toLevelPlayer(player, "right", index));

  return [...left, ...right];
}
