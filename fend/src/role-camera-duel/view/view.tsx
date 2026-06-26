import { useEffect } from "react";
import type { BroadcastRole, RoleCameraPlayer } from "../repository/remote";
import { CameraDuelCard } from "./component/CameraDuelCard";
import styles from "./view.module.css";

type Props = {
  status: string;
  url: string;
  error: string;
  role: BroadcastRole;
  leftPlayer: RoleCameraPlayer | null;
  rightPlayer: RoleCameraPlayer | null;
  preloadLeftPlayer: RoleCameraPlayer | null;
  preloadRightPlayer: RoleCameraPlayer | null;
};

function HiddenPreload({ player, side }: { player: RoleCameraPlayer | null; side: "left" | "right" }) {
  if (!player?.cameraLink) return null;
  return (
    <div className={styles.preloadLayer} aria-hidden="true">
      <CameraDuelCard player={player} side={side} />
    </div>
  );
}

export function RoleCameraDuelView({ status, url, error, role, leftPlayer, rightPlayer, preloadLeftPlayer, preloadRightPlayer }: Props) {
  const hasPlayers = Boolean(leftPlayer || rightPlayer);

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
      <HiddenPreload player={preloadLeftPlayer} side="left" />
      <HiddenPreload player={preloadRightPlayer} side="right" />

      <div className={styles.duelDock}>
        <CameraDuelCard player={leftPlayer} side="left" />
        <CameraDuelCard player={rightPlayer} side="right" />
      </div>

      {!hasPlayers && (
        <div className={styles.waitingPanel}>
          <strong>Waiting for role camera data</strong>
          <span>{error || `${status}: ${url}`}</span>
        </div>
      )}
    </section>
  );
}
