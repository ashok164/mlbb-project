import type { MatchSnapshot, Player } from "../../types";

export const ROLE_ORDER = ["exp", "mid", "roam", "jungle", "gold"] as const;

export type BroadcastRole = (typeof ROLE_ORDER)[number];
export type TeamSide = "left" | "right";

export type RoleCameraPlayer = {
  id: string;
  uid: string;
  role: BroadcastRole;
  teamSide: TeamSide;
  name: string;
  kda: string;
  heroImage: string;
  playerImage: string;
  roleImage: string;
  cameraLink: string;
};

export type RoleCameraDuel = {
  role: BroadcastRole;
  leftPlayer: RoleCameraPlayer | null;
  rightPlayer: RoleCameraPlayer | null;
};

function normalizeRole(value: string | null | undefined): BroadcastRole {
  const clean = String(value || "").trim().toLowerCase();
  return (ROLE_ORDER.includes(clean as BroadcastRole) ? clean : "gold") as BroadcastRole;
}

function normalizeKda(player?: Player | null) {
  if (!player) return "0 / 0 / 0";
  if (player.kda) return player.kda;

  const kills = Number(player.kill_num) || 0;
  const deaths = Number(player.dead_num) || 0;
  const assists = Number(player.assist_num) || 0;
  return `${kills} / ${deaths} / ${assists}`;
}

function fallbackPlayerImage(player?: Player | null) {
  if (player?.roleid) return `/playerpic/${player.roleid}`;
  return "/Public/Players/default.png";
}

function roleImage(role: BroadcastRole) {
  return `/Public/Roles/${role}.png`;
}

function toRoleCameraPlayer(player: Player | undefined, teamSide: TeamSide, role: BroadcastRole): RoleCameraPlayer | null {
  if (!player) return null;

  return {
    id: player.roleid || `${teamSide}-${role}`,
    uid: player.uid || player.roleid || `${teamSide}-${role}`,
    role,
    teamSide,
    name: player.name || `${teamSide.toUpperCase()} ${role.toUpperCase()}`,
    kda: normalizeKda(player),
    heroImage: player.draft_hero_image || player.hero_image || "",
    playerImage: fallbackPlayerImage(player),
    roleImage: roleImage(role),
    cameraLink: player.camera_link || ""
  };
}

function findRolePlayer(players: Player[] | undefined, role: BroadcastRole) {
  return (players || []).find((player) => String(player.role || "").trim().toLowerCase() === role);
}

export function getRequestedRole(search: string) {
  const params = new URLSearchParams(search);
  const role = params.get("role");
  return role ? normalizeRole(role) : null;
}

export function mapSnapshotToRoleCameraDuel(snapshot: MatchSnapshot | null | undefined, role: BroadcastRole): RoleCameraDuel {
  const leftSource = findRolePlayer(snapshot?.left_team.players, role);
  const rightSource = findRolePlayer(snapshot?.right_team.players, role);

  return {
    role,
    leftPlayer: toRoleCameraPlayer(leftSource, "left", role),
    rightPlayer: toRoleCameraPlayer(rightSource, "right", role)
  };
}

export function getNextRole(role: BroadcastRole) {
  const index = ROLE_ORDER.indexOf(role);
  return ROLE_ORDER[(index + 1) % ROLE_ORDER.length];
}
