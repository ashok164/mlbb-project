import type { LiveLevelPlayer } from "../../repository/remote";
import { useEffect, useRef, useState } from "react";
import styles from "../view.module.css";

type Props = {
  player: LiveLevelPlayer;
  theme: "theme1" | "theme2";
};

function formatTimer(seconds: number) {
  return Math.ceil(seconds).toString();
}

export function LiveLevelCard({ player, theme }: Props) {
  const [showUltimateReadyOverlay, setShowUltimateReadyOverlay] = useState(false);
  const previousMajorLeftTime = useRef(player.majorLeftTime);
  const isRight = player.teamSide === "right";
  const isLowHealth = player.healthPct <= 25;
  const isSpellCoolingDown = !player.isDead && player.skillLeftTime > 0;
  const isUltimateCoolingDown = player.majorLeftTime > 0;
  const isUltimateReady = !player.isDead && player.majorLeftTime <= 0;
  const className = [
    styles.card,
    theme === "theme2" ? styles.theme2Card : "",
    isRight ? styles.rightCard : styles.leftCard,
    player.isDead ? styles.deadCard : "",
    player.isEliminated ? styles.eliminatedCard : "",
    player.isLastSurvivor ? styles.lastSurvivorCard : "",
    isUltimateReady ? styles.ultimateReadyCard : ""
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const wasCoolingDown = previousMajorLeftTime.current > 0;
    const isNowReady = !player.isDead && player.majorLeftTime <= 0;
    previousMajorLeftTime.current = player.majorLeftTime;

    if (!wasCoolingDown || !isNowReady) return;

    setShowUltimateReadyOverlay(true);
    const timer = window.setTimeout(() => {
      setShowUltimateReadyOverlay(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [player.isDead, player.majorLeftTime]);

  return (
    <article className={className}>
      <div className={styles.heroFrame}>
        {player.heroImage && (
          <img
            alt={`${player.name} hero`}
            src={player.heroImage}
            onError={(event) => {
              if (player.heroId && event.currentTarget.src.endsWith(".jpg")) {
                event.currentTarget.src = `/Public/Heros/${player.heroId}.png`;
              }
            }}
          />
        )}
        <div className={`${styles.ultimateBadge} ${isUltimateCoolingDown ? styles.ultimateCooldownBadge : styles.ultimateReadyBadge}`}>
          {isUltimateCoolingDown ? <span>{formatTimer(player.majorLeftTime)}</span> : <span className={styles.ultimateReadyDot} />}
        </div>
        <span className={styles.levelBadge}>{player.level}</span>
        {player.isDead && <span className={styles.reviveTimer}>{formatTimer(player.reviveLeftTime)}</span>}
      </div>

      <div className={`${styles.spellFrame} ${isSpellCoolingDown ? styles.spellCooldownActive : ""}`}>
        {player.spellImage && <img alt={`${player.name} spell`} src={player.spellImage} />}
        {isSpellCoolingDown && <span className={styles.spellTimer}>{formatTimer(player.skillLeftTime)}</span>}
      </div>

      <div className={styles.infoBlock}>
        <strong>{player.name}</strong>
        <span>{player.kda}</span>
        <div className={styles.healthTrack} aria-label={`${player.healthPct}% health`}>
          <div
            className={`${styles.healthFill} ${isLowHealth ? styles.lowHealthFill : ""}`}
            style={{ width: `${player.healthPct}%` }}
          />
        </div>
      </div>

      <div className={styles.emblemFrame}>
        {player.emblemImage && <img alt={`${player.name} emblem talent`} src={player.emblemImage} />}
      </div>

      {showUltimateReadyOverlay && <div className={styles.ultimateReadyOverlay}>ULTIMATE READY</div>}
      {player.isEliminated && <div className={styles.eliminatedOverlay}>ELIMINATED</div>}
    </article>
  );
}
