import type { MatchSnapshot, Player } from "../../types";

export type TeamSide = "left" | "right";

export type LiveLevelPlayer = {
  id: string;
  name: string;
  teamSide: TeamSide;
  level: number;
  kda: string;
  heroId: string;
  heroImage: string;
  spellImage: string;
  emblemImage: string;
  isDead: boolean;
  isEliminated: boolean;
  isLastSurvivor: boolean;
  reviveLeftTime: number;
  skillLeftTime: number;
  majorLeftTime: number;
  healthPct: number;
};

function imageId(value: string | number | undefined) {
  return String(value ?? "").trim();
}

function normalizeKda(player: Player) {
  if (player.kda) return player.kda;

  const kills = Number(player.kill_num) || 0;
  const deaths = Number(player.dead_num) || 0;
  const assists = Number(player.assist_num) || 0;
  return `${kills} / ${deaths} / ${assists}`;
}

function heroImage(heroId: string) {
  return heroId ? `/Public/Heros/${heroId}.jpg` : "";
}

function spellImage(skillId: string) {
  return skillId ? `/Public/Spells/${skillId}.png` : "";
}

function emblemImage(talentId: string) {
  return talentId ? `/Public/Emblems/talents/${talentId}.png` : "";
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const clean = value.trim().toLowerCase();
    return clean === "true" || clean === "1" || clean === "yes";
  }

  return false;
}

function normalizeReviveSeconds(player: Player) {
  const rawPlayer = player as Player & Record<string, unknown>;
  const rawValue =
    rawPlayer.revive_left_time ??
    rawPlayer.revive_time ??
    rawPlayer.reviveTime ??
    rawPlayer.relive_left_time ??
    rawPlayer.dead_left_time ??
    0;
  const value = Math.max(0, Number(rawValue) || 0);

  return value > 180 ? Math.ceil(value / 1000) : Math.ceil(value);
}

function normalizeSkillCooldown(player: Player) {
  const rawPlayer = player as Player & Record<string, unknown>;
  const value = Math.max(0, Number(rawPlayer.skill_left_time ?? 0) || 0);

  return value > 180 ? value / 1000 : value;
}

function normalizeMajorCooldown(player: Player) {
  const rawPlayer = player as Player & Record<string, unknown>;
  const value = Math.max(0, Number(rawPlayer.major_left_time ?? 0) || 0);

  return value > 180 ? value / 1000 : value;
}

function normalizePercent(value: unknown) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

function toLiveLevelPlayer(player: Player, teamSide: TeamSide, slot: number): LiveLevelPlayer {
  const heroId = imageId(player.heroid);
  const skillId = imageId(player.skillid);
  const talent3Id = imageId(player.rune_talent_3);
  const reviveLeftTime = normalizeReviveSeconds(player);
  const skillLeftTime = normalizeSkillCooldown(player);
  const majorLeftTime = normalizeMajorCooldown(player);
  const isDead = normalizeBoolean(player.dead);
  const healthPct = normalizePercent(player.hp_pct);

  return {
    id: player.roleid || `${teamSide}-${slot}`,
    name: player.name || `Player ${slot + 1}`,
    teamSide,
    level: Number(player.level) || 0,
    kda: normalizeKda(player),
    heroId,
    heroImage: heroImage(heroId),
    spellImage: spellImage(skillId),
    emblemImage: emblemImage(talent3Id),
    isDead,
    isEliminated: isDead && healthPct <= 0,
    isLastSurvivor: false,
    reviveLeftTime,
    skillLeftTime,
    majorLeftTime,
    healthPct
  };
}

export function mapSnapshotToLiveLevelTeams(snapshot?: MatchSnapshot | null) {
  const leftPlayers = (snapshot?.left_team.players || [])
    .slice(0, 5)
    .map((player, index) => toLiveLevelPlayer(player, "left", index));
  const rightPlayers = (snapshot?.right_team.players || [])
    .slice(0, 5)
    .map((player, index) => toLiveLevelPlayer(player, "right", index));

  const alivePlayers = (players: LiveLevelPlayer[]) => players.filter(
    (player) => player.id && player.heroId && !player.isDead && player.healthPct > 0,
  );
  const leftAlivePlayers = alivePlayers(leftPlayers);
  const rightAlivePlayers = alivePlayers(rightPlayers);

  const leftLastSurvivorId = leftAlivePlayers.length === 1 ? leftAlivePlayers[0].id : "";
  const rightLastSurvivorId = rightAlivePlayers.length === 1 ? rightAlivePlayers[0].id : "";

  return {
    leftPlayers: leftPlayers.map((player) => ({
      ...player,
      isLastSurvivor: player.id === leftLastSurvivorId
    })),
    rightPlayers: rightPlayers.map((player) => ({
      ...player,
      isLastSurvivor: player.id === rightLastSurvivorId
    }))
  };
}
