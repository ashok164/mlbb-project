import { useTeamLevelRankingController } from "../controller/controller";
import { TeamLevelRankingView } from "./view";

export default function TeamLevelRankingPage() {
  const controller = useTeamLevelRankingController();
  return <TeamLevelRankingView {...controller} />;
}
