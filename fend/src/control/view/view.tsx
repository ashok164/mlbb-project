import { Save } from "lucide-react";
import type { MatchSnapshot, Player } from "../../types";

type Props = {
  snapshot: MatchSnapshot | null;
  players: Player[];
  assignments: Record<string, string>;
  roleOptions: string[];
  setRole: (roleid: string, role: string) => void;
  save: () => void;
  status: string;
};

export function ControlView({ snapshot, players, assignments, roleOptions, setRole, save, status }: Props) {
  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Role Assignment</p>
          <h1>Control</h1>
        </div>
        <button className="primary-button" onClick={save}>
          <Save size={18} />
          <span>Save</span>
        </button>
      </header>

      {status && <div className="notice">{status}</div>}

      <div className="control-table">
        <header>
          <span>{snapshot?.left_team.name || "Left"} / {snapshot?.right_team.name || "Right"}</span>
          <strong>{players.length} players</strong>
        </header>
        {players.map((player) => (
          <div className="control-row" key={player.roleid}>
            <img alt="" src={player.draft_hero_image || player.hero_image} />
            <div>
              <strong>{player.name}</strong>
              <span>Role ID {player.roleid}</span>
            </div>
            <select value={assignments[player.roleid] || ""} onChange={(event) => setRole(player.roleid, event.target.value)}>
              <option value="">Select role</option>
              {roleOptions.map((role) => (
                <option value={role} key={role}>{role.toUpperCase()}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
