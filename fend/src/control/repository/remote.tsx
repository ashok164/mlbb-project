import { requestBackend } from "../../main/routes/apiRoutes";
import type { MatchSnapshot } from "../../types";

export function getControlSnapshot() {
  return requestBackend<MatchSnapshot>("/data");
}

export function saveRoleAssignments(assignments: Record<string, string>) {
  return requestBackend<{ success: boolean }>("/assign", {
    method: "POST",
    body: JSON.stringify(assignments)
  });
}
