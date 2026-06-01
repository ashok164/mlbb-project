import { requestBackend } from "../../main/routes/apiRoutes";
import type { MatchSnapshot, RoleAssignmentMap } from "../../types";

export function getControlSnapshot() {
  return requestBackend<MatchSnapshot>("/data");
}

export function saveRoleAssignments(assignments: RoleAssignmentMap) {
  return requestBackend<{ success: boolean }>("/assign", {
    method: "POST",
    body: JSON.stringify(assignments)
  });
}
