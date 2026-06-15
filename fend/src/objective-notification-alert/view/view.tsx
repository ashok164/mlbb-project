import { useEffect } from "react";
import type { ObjectiveAlertVisual } from "../repository/remote";
import { AlertCard } from "./component/AlertCard";
import styles from "./view.module.css";

type Props = {
  status: string;
  url: string;
  error: string;
  activeAlert: ObjectiveAlertVisual | null;
};

export function ObjectiveNotificationAlertView({ activeAlert }: Props) {
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
      {activeAlert && <AlertCard key={activeAlert.id} alert={activeAlert} />}
    </section>
  );
}
