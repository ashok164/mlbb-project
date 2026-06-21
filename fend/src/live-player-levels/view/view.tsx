import type { LiveLevelPlayer } from "../repository/remote";
import { LiveLevelCard } from "./component/LiveLevelCard";
import { useEffect, useState } from "react";
import styles from "./view.module.css";

const BROADCAST_THEME_STORAGE_KEY = "broadcast-theme";
const BROADCAST_THEME_CHANGE_EVENT = "broadcast-theme-change";
type BroadcastTheme = "theme1" | "theme2";

type Props = {
  status: string;
  url: string;
  error: string;
  leftPlayers: LiveLevelPlayer[];
  rightPlayers: LiveLevelPlayer[];
};

function TeamStack({ players, side, theme }: { players: LiveLevelPlayer[]; side: "left" | "right"; theme: BroadcastTheme }) {
  return (
    <div className={`${styles.stack} ${side === "right" ? styles.rightStack : styles.leftStack}`}>
      {players.map((player, index) => (
        <LiveLevelCard key={player.id || `${side}-${index}`} player={player} theme={theme} />
      ))}
    </div>
  );
}

export function LivePlayerLevelsView({ status, url, error, leftPlayers, rightPlayers }: Props) {
  const hasPlayers = leftPlayers.length > 0 || rightPlayers.length > 0;
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
      <TeamStack side="left" players={leftPlayers} theme={theme} />
      <TeamStack side="right" players={rightPlayers} theme={theme} />

      {!hasPlayers && (
        <div className={styles.waitingPanel}>
          <strong>Waiting for live player data</strong>
          <span>{error || `${status}: ${url}`}</span>
        </div>
      )}
    </section>
  );
}
