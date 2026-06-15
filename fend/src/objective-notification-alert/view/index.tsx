import { useObjectiveNotificationAlertController } from "../controller/controller";
import { mapObjectiveAlertVisual } from "../repository/remote";
import { ObjectiveNotificationAlertView } from "./view";

export default function ObjectiveNotificationAlertPage() {
  const controller = useObjectiveNotificationAlertController();
  return <ObjectiveNotificationAlertView {...controller} activeAlert={mapObjectiveAlertVisual(controller.activeAlert)} />;
}
