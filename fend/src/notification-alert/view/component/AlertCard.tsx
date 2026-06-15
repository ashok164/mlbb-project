import type { AlertVisual } from "../../repository/remote";
import styles from "../view.module.css";

type Props = {
  alert: AlertVisual;
};

export function AlertCard({ alert }: Props) {
  const isCornerAlert =
    alert.trigger === "turtle_spawn" ||
    alert.trigger === "lord_spawn";
  const isSlainAlert =
    alert.trigger === "turtle_slain" ||
    alert.trigger === "lord_slain";
  const spellImage = alert.killer_spell_image || "";

  return (
    <div
      className={[
        styles.card,
        alert.killer_team_side === "right" ? styles.rightCard : styles.leftCard,
        isCornerAlert ? styles.cornerCard : "",
        !isCornerAlert ? styles.centeredCard : "",
        isSlainAlert ? styles.slainCard : ""
      ].join(" ")}
    >
      {alert.asset_url && (
        <video
          key={alert.id}
          className={styles.video}
          src={alert.asset_url}
          autoPlay
          muted
          playsInline
        />
      )}

      {alert.killer_name && (
        <div className={styles.playerInfo}>
          <img
            alt=""
            className={styles.playerImage}
            src={alert.killer_player_image || "/Public/Players/default.png"}
            onError={(event) => {
              event.currentTarget.src = "/Public/Players/default.png";
            }}
          />
          <div className={styles.playerPlate}>
            {spellImage && (
              <img
                alt=""
                className={styles.spellIcon}
                src={spellImage}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
            <div className={styles.playerName}>{alert.killer_name}</div>
          </div>
        </div>
      )}
    </div>
  );
}
