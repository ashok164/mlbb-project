import { useInGameNotificationController } from "../controller/controller";
import { InGameNotificationView } from "./view";

export default function InGameNotificationPage() {
  const controller = useInGameNotificationController();
  return <InGameNotificationView {...controller} />;
}
