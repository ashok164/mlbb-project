import { useLivePlayerLevelsController } from "../controller/controller";
import { LivePlayerLevelsView } from "./view";

export default function LivePlayerLevelsPage() {
  const controller = useLivePlayerLevelsController();
  return <LivePlayerLevelsView {...controller} />;
}
