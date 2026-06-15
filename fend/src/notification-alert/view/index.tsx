import { useNotificationAlertController } from "../controller/controller";
import { mapAlertVisual } from "../repository/remote";
import { NotificationAlertView } from "./view";

export default function NotificationAlertPage() {
  const controller = useNotificationAlertController();
  return <NotificationAlertView {...controller} activeAlert={mapAlertVisual(controller.activeAlert)} />;
}
