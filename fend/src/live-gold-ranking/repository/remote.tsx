import type { MatchSnapshot, Player } from "../../types";

export type GoldRankingPlayer = {
  id: string;
  rank: number;
  name: string;
  playerImage: string;
  heroImage: string;
  itemImages: string[];
  gold: number;
  goldLabel: string;
};

function imageId(value: string | number | undefined) {
  return String(value ?? "").trim();
}

function formatGold(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
}

function playerImage(roleId: string) {
  return roleId ? `/Players/${roleId}.png` : "/Players/default.png";
}

function heroImage(heroId: string) {
  return heroId ? `/Heros/${heroId}.jpg` : "";
}

function itemImage(itemId: string) {
  return itemId ? `/Equipment/Main/${itemId}.png` : "";
}

function toGoldRankingPlayer(player: Player, index: number): GoldRankingPlayer {
  const roleId = imageId(player.roleid);
  const heroId = imageId(player.heroid);
  const itemImages = (player.equips || [])
    .map((item) => imageId(item.id))
    .filter((itemId) => itemId && itemId !== "blank")
    .map(itemImage);
  const gold = Number(player.gold ?? player.total_money) || 0;

  return {
    id: roleId || `${player.campid || "player"}-${index}`,
    rank: index + 1,
    name: (player.name || `PLAYER ${index + 1}`).toUpperCase(),
    playerImage: playerImage(roleId),
    heroImage: heroImage(heroId),
    itemImages,
    gold,
    goldLabel: formatGold(gold)
  };
}

export function mapSnapshotToGoldRanking(snapshot?: MatchSnapshot | null) {
  return [...(snapshot?.all_players || [])]
    .sort((a, b) => (Number(b.gold ?? b.total_money) || 0) - (Number(a.gold ?? a.total_money) || 0))
    .map(toGoldRankingPlayer);
}
