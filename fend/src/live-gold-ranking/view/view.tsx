import { useEffect } from "react";
import type { GoldRankingPlayer } from "../repository/remote";
import { GoldRankingRow } from "./component/GoldRankingRow";
import styles from "./view.module.css";

type Props = {
  status: string;
  url: string;
  error: string;
  players: GoldRankingPlayer[];
};

export function LiveGoldRankingView({ status, url, error, players }: Props) {
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
      <div className={styles.panel}>
        <header className={styles.header}>GOLD RANKING</header>
        <div className={styles.rows}>
          {players.map((player) => (
            <GoldRankingRow key={player.id} player={player} />
          ))}
        </div>
      </div>

      {players.length === 0 && (
        <div className={styles.waitingPanel}>
          <strong>Waiting for gold ranking data</strong>
          <span>{error || `${status}: ${url}`}</span>
        </div>
      )}
    </section>
  );
}
