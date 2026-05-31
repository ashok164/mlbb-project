import { Activity, Bell, Clock, Radio } from "lucide-react";
import type { MatchSnapshot, Player } from "../../types";
import { TeamPanel } from "./component/TeamPanel";

type Props = {
  status: string;
  url: string;
  snapshot: MatchSnapshot | null;
  error: string;
  updatedAt: string;
};

function countActivePlayers(players: Player[] = []) {
  return players.filter((player) => player.name || player.heroid).length;
}

export function NotificationView({ status, url, snapshot, error, updatedAt }: Props) {
  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Live WebSocket Monitor</p>
          <h1>Notifications</h1>
        </div>
        <div className={`status-pill ${status}`}>
          <Radio size={16} />
          <span>{status}</span>
        </div>
      </header>

      <div className="summary-grid">
        <div className="metric">
          <Bell size={20} />
          <span>State</span>
          <strong>{snapshot?.state || "Waiting"}</strong>
        </div>
        <div className="metric">
          <Clock size={20} />
          <span>Game Time</span>
          <strong>{snapshot?.game_time_fmt || "00 : 00"}</strong>
        </div>
        <div className="metric">
          <Activity size={20} />
          <span>Players</span>
          <strong>{snapshot ? countActivePlayers(snapshot.all_players) : 0}/10</strong>
        </div>
      </div>

      {error && <div className="notice">{error}</div>}

      {snapshot ? (
        <div className="team-grid">
          <TeamPanel side="left" team={snapshot.left_team} />
          <TeamPanel side="right" team={snapshot.right_team} />
        </div>
      ) : (
        <div className="empty-state">Waiting for backend data from {url}</div>
      )}

      <footer className="page-footer">{updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : "No socket update yet"}</footer>
    </section>
  );
}
