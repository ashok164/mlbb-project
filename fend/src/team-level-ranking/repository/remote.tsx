import type { MatchSnapshot, Player } from "../../types";

const LEVEL_CAP = 15;

export type TeamLevelRankingPlayer = {
  id: string;
  rank: number;
  teamSide: "left" | "right";
  name: string;
  heroKey: string;
  heroImage: string;
  level: number;
  levelLabel: string;
  levelFillPercent: number;
};

function imageId(value: string | number | undefined) {
  return String(value ?? "").trim();
}

function heroImage(heroId: string) {
  return heroId ? `/Public/Heros/${heroId}.jpg` : "";
}

function normalizeLevel(player: Player) {
  return Math.max(0, Number(player.level) || 0);
}

function toTeamLevelRankingPlayer(player: Player, index: number, teamSide: "left" | "right"): TeamLevelRankingPlayer {
  const heroId = imageId(player.heroid);
  const level = normalizeLevel(player);
  const heroKey = String(player.assigned_hero_name || heroId || "HERO KEY").trim();

  return {
    id: imageId(player.roleid) || `${imageId(player.campid) || "team"}-${index}`,
    rank: index + 1,
    teamSide,
    name: (player.name || "PLAYER NAME").toUpperCase(),
    heroKey: heroKey.toUpperCase(),
    heroImage: heroImage(heroId),
    level,
    levelLabel: String(level),
    levelFillPercent: Math.min(level, LEVEL_CAP) / LEVEL_CAP * 100
  };
}

function sortPlayers(players: Player[], teamSide: "left" | "right") {
  return [...players]
    .sort((a, b) => normalizeLevel(b) - normalizeLevel(a))
    .slice(0, 5)
    .map((player, index) => toTeamLevelRankingPlayer(player, index, teamSide));
}

export function mapSnapshotToTeamLevelRanking(snapshot?: MatchSnapshot | null) {
  const leftPlayers = sortPlayers(snapshot?.left_team.players || [], "left");
  const rightPlayers = sortPlayers(snapshot?.right_team.players || [], "right");
  const players = [...leftPlayers, ...rightPlayers].map((player, index) => ({
    ...player,
    rank: index + 1
  }));

  return { players };
}
