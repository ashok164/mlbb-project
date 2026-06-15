import type { MatchSnapshot, Player } from "../../types";

const GOLD_CAP = 100000;

export type TeamGoldRankingPlayer = {
  id: string;
  rank: number;
  teamSide: "left" | "right";
  name: string;
  heroKey: string;
  heroImage: string;
  gold: number;
  goldLabel: string;
  goldFillPercent: number;
};

function imageId(value: string | number | undefined) {
  return String(value ?? "").trim();
}

function heroImage(heroId: string) {
  return heroId ? `/Public/Heros/${heroId}.jpg` : "";
}

function normalizeGold(player: Player) {
  return Math.max(0, Number(player.gold ?? player.total_money) || 0);
}

function formatGold(value: number) {
  if (value >= GOLD_CAP) return "100K";
  return String(Math.round(value));
}

function toTeamGoldRankingPlayer(player: Player, index: number, teamSide: "left" | "right"): TeamGoldRankingPlayer {
  const heroId = imageId(player.heroid);
  const gold = normalizeGold(player);
  const heroKey = String(player.assigned_hero_name || heroId || "HERO KEY").trim();

  return {
    id: imageId(player.roleid) || `${imageId(player.campid) || "team"}-${index}`,
    rank: index + 1,
    teamSide,
    name: (player.name || "PLAYER NAME").toUpperCase(),
    heroKey: heroKey.toUpperCase(),
    heroImage: heroImage(heroId),
    gold,
    goldLabel: formatGold(gold),
    goldFillPercent: Math.min(gold, GOLD_CAP) / GOLD_CAP * 100
  };
}

export function mapSnapshotToTeamGoldRanking(snapshot?: MatchSnapshot | null) {
  const leftPlayers = (snapshot?.left_team.players || []).map((player, index) =>
    toTeamGoldRankingPlayer(player, index, "left"),
  );
  const rightPlayers = (snapshot?.right_team.players || []).map((player, index) =>
    toTeamGoldRankingPlayer(player, index, "right"),
  );
  const players = [...leftPlayers, ...rightPlayers]
    .sort((a, b) => b.gold - a.gold)
    .slice(0, 10)
    .map((player, index) => ({
      ...player,
      rank: index + 1
    }));

  return { players };
}
