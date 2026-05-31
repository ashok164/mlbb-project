import { useNotificationController } from "../controller/controller";
import { NotificationView } from "./view";

export default function NotificationPage() {
  const controller = useNotificationController();
  return <NotificationView {...controller} />;
}
