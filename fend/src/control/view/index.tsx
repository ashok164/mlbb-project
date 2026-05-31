import { useControlController } from "../controller/controller";
import { ControlView } from "./view";

export default function ControlPage() {
  const controller = useControlController();
  return <ControlView {...controller} />;
}
