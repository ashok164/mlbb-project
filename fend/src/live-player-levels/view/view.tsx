import type { LiveLevelPlayer } from "../repository/remote";
import { LiveLevelCard } from "./component/LiveLevelCard";
import { useEffect } from "react";
import styles from "./view.module.css";

type Props = {
  status: string;
  url: string;
  error: string;
  leftPlayers: LiveLevelPlayer[];
  rightPlayers: LiveLevelPlayer[];
};

function TeamStack({ players, side }: { players: LiveLevelPlayer[]; side: "left" | "right" }) {
  return (
    <div className={`${styles.stack} ${side === "right" ? styles.rightStack : styles.leftStack}`}>
      {players.map((player, index) => (
        <LiveLevelCard key={player.id || `${side}-${index}`} player={player} />
      ))}
    </div>
  );
}

export function LivePlayerLevelsView({ status, url, error, leftPlayers, rightPlayers }: Props) {
  const hasPlayers = leftPlayers.length > 0 || rightPlayers.length > 0;

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
      <TeamStack side="left" players={leftPlayers} />
      <TeamStack side="right" players={rightPlayers} />

      {!hasPlayers && (
        <div className={styles.waitingPanel}>
          <strong>Waiting for live player data</strong>
          <span>{error || `${status}: ${url}`}</span>
        </div>
      )}
    </section>
  );
}
