import type { TeamGoldRankingPlayer } from "../../repository/remote";
import styles from "../view.module.css";

type Props = {
  player: TeamGoldRankingPlayer;
};

export function TeamGoldRankingRow({ player }: Props) {
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
          <span>{player.goldLabel}</span>
        </div>
        <div className={styles.heroKey}>{player.heroKey}</div>
      </div>
      <div className={styles.barCell}>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${player.goldFillPercent}%` }} />
        </div>
      </div>
    </article>
  );
}
