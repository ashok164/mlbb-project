import { useEffect } from "react";
import type { TeamGoldRankingPlayer } from "../repository/remote";
import { TeamGoldRankingRow } from "./component/TeamGoldRankingRow";
import styles from "./view.module.css";

type Props = {
  status: string;
  url: string;
  error: string;
  players: TeamGoldRankingPlayer[];
};

export function TeamGoldRankingView({ status, url, error, players }: Props) {
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
          <span className={styles.headerIcon}>$</span>
          <div className={styles.headerText}>
            <span>Gold Ranking</span>
          </div>
        </header>
        <div className={styles.rows}>
          {players.map((player) => (
            <TeamGoldRankingRow key={player.id} player={player} />
          ))}
        </div>
      </section>

      {!hasPlayers && (
        <div className={styles.waitingPanel}>
          <strong>Waiting for team gold ranking data</strong>
          <span>{error || `${status}: ${url}`}</span>
        </div>
      )}
    </section>
  );
}
