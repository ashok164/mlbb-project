import type { TeamLevelRankingPlayer } from "../../repository/remote";
import styles from "../view.module.css";

type Props = {
  player: TeamLevelRankingPlayer;
};

export function TeamLevelRankingRow({ player }: Props) {
  return (
    <article
      className={[
        styles.row,
        player.teamSide === "right" ? styles.rightTeamRow : styles.leftTeamRow
      ].join(" ")}
    >
      <div className={styles.rank}>{player.rank}</div>
      <div className={styles.heroThumb}>
        {player.heroImage && (
          <img
            alt={`${player.name} hero`}
            src={player.heroImage}
            onError={(event) => {
              const target = event.currentTarget;
              if (target.src.endsWith(".jpg")) {
                target.src = target.src.slice(0, -4) + ".png";
              }
            }}
          />
        )}
      </div>
      <div className={styles.nameCell}>
        <div className={styles.topLine}>
          <strong>{player.name}</strong>
          <span>{player.levelLabel}</span>
        </div>
        <div className={styles.heroKey}>{player.heroKey}</div>
      </div>
      <div className={styles.barCell}>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${player.levelFillPercent}%` }} />
        </div>
      </div>
    </article>
  );
}
