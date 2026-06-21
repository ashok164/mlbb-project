import { useEffect, useState } from "react";
import type { TeamLevelRankingPlayer } from "../repository/remote";
import { TeamLevelRankingRow } from "./component/TeamLevelRankingRow";
import styles from "./view.module.css";

const BROADCAST_THEME_STORAGE_KEY = "broadcast-theme";
const BROADCAST_THEME_CHANGE_EVENT = "broadcast-theme-change";
type BroadcastTheme = "theme1" | "theme2";

type Props = {
  status: string;
  url: string;
  error: string;
  players: TeamLevelRankingPlayer[];
};

export function TeamLevelRankingView({ status, url, error, players }: Props) {
  const hasPlayers = players.length > 0;
  const [theme, setTheme] = useState<BroadcastTheme>("theme1");

  useEffect(() => {
    document.documentElement.classList.add("overlay-page");
    document.body.classList.add("overlay-page");

    const syncTheme = () => {
      const storedTheme = window.localStorage.getItem(BROADCAST_THEME_STORAGE_KEY);
      setTheme(storedTheme === "theme2" ? "theme2" : "theme1");
    };

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener(BROADCAST_THEME_CHANGE_EVENT, syncTheme);

    return () => {
      document.documentElement.classList.remove("overlay-page");
      document.body.classList.remove("overlay-page");
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(BROADCAST_THEME_CHANGE_EVENT, syncTheme);
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
