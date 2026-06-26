import { GripVertical, Save } from "lucide-react";
import type { MatchSnapshot, Player, RoleAssignmentMap } from "../../types";

type Props = {
  snapshot: MatchSnapshot | null;
  players: Player[];
  assignments: RoleAssignmentMap;
  sequenceByRoleid: Record<string, number>;
  roleOptions: string[];
  setRole: (roleid: string, role: string) => void;
  setHeroName: (roleid: string, heroName: string) => void;
  setCameraLink: (roleid: string, cameraLink: string) => void;
  movePlayer: (fromIndex: number, toIndex: number) => void;
  save: () => void;
  status: string;
};

export function ControlView({ snapshot, players, assignments, sequenceByRoleid, roleOptions, setRole, setHeroName, setCameraLink, movePlayer, save, status }: Props) {
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
        <div className="control-columns">
          <span />
          <span>Seq</span>
          <span>Hero</span>
          <span>Player</span>
          <span>Camera</span>
          <span>Hero Name</span>
          <span>Role</span>
        </div>
        {players.map((player, index) => (
          <div
            className="control-row"
            draggable
            key={player.roleid}
            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              movePlayer(Number(event.dataTransfer.getData("text/plain")), index);
            }}
          >
            <button className="icon-button" type="button" aria-label="Drag player">
              <GripVertical size={18} />
            </button>
            <strong>#{sequenceByRoleid[player.roleid] || index + 1}</strong>
            <img alt="" src={player.draft_hero_image || player.hero_image} />
            <div>
              <strong>{player.name}</strong>
              <span>UID {player.uid || player.roleid}</span>
            </div>
            <div>
              <input
                className="control-text-input"
                type="text"
                placeholder="Camera link"
                value={assignments[player.roleid]?.camera_link || player.camera_link || ""}
                onChange={(event) => setCameraLink(player.roleid, event.target.value)}
              />
            </div>
            <input
              className="control-text-input"
              type="text"
              placeholder="Assigned hero name"
              value={assignments[player.roleid]?.hero_name || player.assigned_hero_name || ""}
              onChange={(event) => setHeroName(player.roleid, event.target.value)}
            />
            <select value={assignments[player.roleid]?.role || ""} onChange={(event) => setRole(player.roleid, event.target.value)}>
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
