import { useEffect } from "react";
import type { AlertVisual } from "../repository/remote";
import { AlertCard } from "./component/AlertCard";
import styles from "./view.module.css";

type Props = {
  status: string;
  url: string;
  error: string;
  activeAlert: AlertVisual | null;
};

export function NotificationAlertView({ activeAlert }: Props) {
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
      {activeAlert && <AlertCard alert={activeAlert} />}
    </section>
  );
}
