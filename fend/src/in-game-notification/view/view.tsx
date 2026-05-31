import type { InGameNotification } from "../controller/controller";
import { NotificationStack } from "./component/NotificationStack";
import styles from "./view.module.css";
import { useEffect } from "react";

type Props = {
  status: string;
  url: string;
  leftNotifications: InGameNotification[];
  rightNotifications: InGameNotification[];
};

export function InGameNotificationView({ leftNotifications, rightNotifications }: Props) {
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
      <NotificationStack side="left" notifications={leftNotifications} />
      <NotificationStack side="right" notifications={rightNotifications} />
    </section>
  );
}
