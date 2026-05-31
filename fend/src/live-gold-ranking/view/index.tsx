import { useLiveGoldRankingController } from "../controller/controller";
import { LiveGoldRankingView } from "./view";

export default function LiveGoldRankingPage() {
  const controller = useLiveGoldRankingController();
  return <LiveGoldRankingView {...controller} />;
}
