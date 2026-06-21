import type { InGameNotification } from "../controller/controller";
import { NotificationStack } from "./component/NotificationStack";
import styles from "./view.module.css";
import { useEffect, useState } from "react";

const BROADCAST_THEME_STORAGE_KEY = "broadcast-theme";
const BROADCAST_THEME_CHANGE_EVENT = "broadcast-theme-change";
type BroadcastTheme = "theme1" | "theme2";

type Props = {
  status: string;
  url: string;
  leftNotifications: InGameNotification[];
  rightNotifications: InGameNotification[];
};

export function InGameNotificationView({ leftNotifications, rightNotifications }: Props) {
  const [theme, setTheme] = useState<BroadcastTheme>("theme1");

  useEffect(() => {
    document.documentElement.classList.add("overlay-page");
    document.body.classList.add("overlay-page");

    const syncTheme = () => {
      const storedTheme = window.localStorage.getItem(BROADCAST_THEME_STORAGE_KEY);
      setTheme(storedTheme === "theme2" ? "theme2" : "theme1");
    };

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener(BROADCAST_THEME_CHANGE_EVENT, syncTheme);

    return () => {
      document.documentElement.classList.remove("overlay-page");
      document.body.classList.remove("overlay-page");
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(BROADCAST_THEME_CHANGE_EVENT, syncTheme);
    };
  }, []);

  return (
    <section className={styles.stage}>
      <NotificationStack side="left" notifications={leftNotifications} theme={theme} />
      <NotificationStack side="right" notifications={rightNotifications} theme={theme} />
    </section>
  );
}
