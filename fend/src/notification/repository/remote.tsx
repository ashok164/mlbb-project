import { requestBackend } from "../../main/routes/apiRoutes";
import type { MatchSnapshot } from "../../types";

export function getCurrentSnapshot() {
  return requestBackend<MatchSnapshot>("/data");
}
