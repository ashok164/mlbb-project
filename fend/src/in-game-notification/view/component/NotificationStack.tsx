import type { InGameNotification } from "../../controller/controller";
import { LevelUpCard } from "./LevelUpCard";
import styles from "../view.module.css";

type Props = {
  side: "left" | "right";
  notifications: InGameNotification[];
};

const lanes = [0, 1, 2, 3, 4];

export function NotificationStack({ side, notifications }: Props) {
  return (
    <div className={`${styles.stack} ${side === "left" ? styles.leftStack : styles.rightStack}`}>
      {lanes.map((slot) => {
        const notification = notifications.find((item) => item.slot === slot);

        return (
          <div className={styles.lane} key={`${side}-${slot}`}>
            {notification && <LevelUpCard notification={notification} />}
          </div>
        );
      })}
    </div>
  );
}
