export type BackendRoute = {
  label: string;
  path: string;
  method: "GET" | "POST";
  group: "control" | "api" | "asset" | "text";
  endpoint?: string;
  description: string;
};

export type WsEnvelope<T = unknown> = {
  type: string;
  state: string;
  battle_id: string;
  updated_at: string;
  ok: boolean;
  data?: T;
  error?: string;
};

export type RoleAssignment = {
  role: string;
  sequence_number: number;
};

export type RoleAssignmentMap = Record<string, RoleAssignment>;

export type Player = {
  name: string;
  role: string;
  roleid: string;
  heroid: string | number;
  equips?: Array<{
    id?: string | number;
    image?: string;
  }>;
  playerpic_image?: string;
  ingame_hero_image?: string;
  hero_image?: string;
  draft_hero_image?: string;
  campid?: string | number;
  sequence_number?: number;
  kda?: string;
  kill_num?: number;
  dead_num?: number;
  assist_num?: number;
  gold?: number;
  gold_k?: string;
  total_money?: number;
  total_money_k?: string;
  level?: number;
  skillid?: string | number;
  spell_image?: string;
  rune_id?: string | number;
  rune_image?: string;
  rune_talent_1?: string | number;
  rune_talent_2?: string | number;
  rune_talent_3?: string | number;
  rune_talent_1_image?: string;
  rune_talent_2_image?: string;
  rune_talent_3_image?: string;
  dead?: boolean;
  revive_left_time?: number;
  hp_pct?: number;
  mana_pct?: number;
  left_gold_diff?: string;
  right_gold_diff?: string;
  gold_leader?: string;
};

export type Team = {
  name: string;
  total_kills?: number;
  total_gold?: string;
  kill_lord?: number;
  kill_tower?: number;
  kill_tortoise?: number;
  win?: boolean;
  players: Player[];
};

export type MatchSnapshot = {
  state: string;
  game_time?: number;
  game_time_fmt?: string;
  win_camp?: number;
  left_team: Team;
  right_team: Team;
  all_players: Player[];
  gold_diff?: Record<string, unknown>;
};
