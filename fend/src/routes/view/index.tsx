import { useRoutesController } from "../controller/controller";
import { RoutesView } from "./view";

export default function RoutesPage() {
  const controller = useRoutesController();
  return <RoutesView {...controller} />;
}
