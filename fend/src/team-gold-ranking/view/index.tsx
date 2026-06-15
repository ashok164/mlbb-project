import { useTeamGoldRankingController } from "../controller/controller";
import { TeamGoldRankingView } from "./view";

export default function TeamGoldRankingPage() {
  const controller = useTeamGoldRankingController();
  return <TeamGoldRankingView {...controller} />;
}
