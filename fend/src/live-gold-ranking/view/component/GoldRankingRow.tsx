import type { GoldRankingPlayer } from "../../repository/remote";
import styles from "../view.module.css";

type Props = {
  player: GoldRankingPlayer;
};

export function GoldRankingRow({ player }: Props) {
  return (
    <article className={styles.row}>
      <div className={styles.rank}>#{player.rank}</div>
      <div className={styles.portrait}>
        <img
          alt={`${player.name} player`}
          src={player.playerImage}
          onError={(event) => {
            event.currentTarget.src = "/Players/default.png";
          }}
        />
      </div>
      <div className={styles.names}>
        <strong>{player.name}</strong>
        <div className={styles.items}>
          {player.itemImages.map((image, index) => (
            <span className={styles.item} key={`${image}-${index}`}>
              <img alt="" src={image} />
            </span>
          ))}
        </div>
      </div>
      <div className={styles.hero}>
        {player.heroImage && (
          <img
            alt={`${player.name} character`}
            src={player.heroImage}
            onError={(event) => {
              if (event.currentTarget.src.endsWith(".jpg")) {
                event.currentTarget.src = player.heroImage.replace(".jpg", ".png");
              }
            }}
          />
        )}
      </div>
      <div className={styles.gold}>{player.goldLabel}</div>
    </article>
  );
}
