import type { LiveLevelPlayer } from "../../repository/remote";
import styles from "../view.module.css";

type Props = {
  player: LiveLevelPlayer;
};

function formatTimer(seconds: number) {
  return Math.ceil(seconds).toString();
}

export function LiveLevelCard({ player }: Props) {
  const isRight = player.teamSide === "right";
  const isLowHealth = player.healthPct <= 25;
  const className = [
    styles.card,
    isRight ? styles.rightCard : styles.leftCard,
    player.isDead ? styles.deadCard : "",
    player.isEliminated ? styles.eliminatedCard : "",
    player.isLastSurvivor ? styles.lastSurvivorCard : ""
  ]
    .filter(Boolean)
    .join(" ");

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
        <span className={styles.levelBadge}>{player.level}</span>
        {player.isDead && <span className={styles.reviveTimer}>{formatTimer(player.reviveLeftTime)}</span>}
      </div>

      <div className={styles.spellFrame}>
        {player.spellImage && <img alt={`${player.name} spell`} src={player.spellImage} />}
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

      {player.isEliminated && <div className={styles.eliminatedOverlay}>ELIMINATED</div>}
    </article>
  );
}
