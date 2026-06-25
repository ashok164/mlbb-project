import { useEffect } from "react";
import type { TeamLevelRankingPlayer } from "../repository/remote";
import { TeamLevelRankingRow } from "./component/TeamLevelRankingRow";
import styles from "./view.module.css";

type Props = {
  status: string;
  url: string;
  error: string;
  players: TeamLevelRankingPlayer[];
};

export function TeamLevelRankingView({ status, url, error, players }: Props) {
  const hasPlayers = players.length > 0;
  const theme = "theme2" as const;

  useEffect(() => {
    document.documentElement.classList.add("overlay-page");
    document.body.classList.add("overlay-page");

    return () => {
      document.documentElement.classList.remove("overlay-page");
      document.body.classList.remove("overlay-page");
    };
  }, []);

  return (
    <section className={styles.stage}>
      <section className={[styles.panel, theme === "theme2" ? styles.theme2Panel : ""].filter(Boolean).join(" ")}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>L</span>
          <div className={styles.headerText}>
            <span>Level Ranking</span>
          </div>
        </header>
        <div className={styles.rows}>
          {players.map((player) => (
            <TeamLevelRankingRow key={player.id} player={player} />
          ))}
        </div>
      </section>

      {!hasPlayers && (
        <div className={styles.waitingPanel}>
          <strong>Waiting for team level ranking data</strong>
          <span>{error || `${status}: ${url}`}</span>
        </div>
      )}
    </section>
  );
}
