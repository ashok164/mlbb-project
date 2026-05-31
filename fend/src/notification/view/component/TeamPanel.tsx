import type { Team } from "../../../types";

type Props = {
  side: "left" | "right";
  team: Team;
};

export function TeamPanel({ side, team }: Props) {
  return (
    <article className={`team-panel ${side}`}>
      <header>
        <div>
          <span>{side.toUpperCase()} TEAM</span>
          <h2>{team.name}</h2>
        </div>
        <strong>{team.total_kills ?? 0}</strong>
      </header>
      <div className="objective-row">
        <span>Lord {team.kill_lord ?? 0}</span>
        <span>Tower {team.kill_tower ?? 0}</span>
        <span>Turtle {team.kill_tortoise ?? 0}</span>
      </div>
      <div className="player-list">
        {(team.players || []).map((player, index) => (
          <div className="player-row" key={`${player.roleid}-${index}`}>
            <img alt="" src={player.draft_hero_image || player.hero_image} />
            <div>
              <strong>{player.name || "Empty slot"}</strong>
              <span>{player.role || "unassigned"} · L{player.level ?? 0}</span>
            </div>
            <b>{player.kda || "0 / 0 / 0"}</b>
          </div>
        ))}
      </div>
    </article>
  );
}
