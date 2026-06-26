import type { ReactElement } from "react";
import { Layout } from "../view/Layout";
import ControlPage from "../../control/view";
import InGameNotificationPage from "../../in-game-notification/view";
import LiveGoldRankingPage from "../../live-gold-ranking/view";
import LivePlayerLevelsPage from "../../live-player-levels/view";
import ObjectiveNotificationAlertPage from "../../objective-notification-alert/view";
import NotificationAlertPage from "../../notification-alert/view";
import NotificationPage from "../../notification/view";
import RoleCameraDuelPage from "../../role-camera-duel/view";
import RoutesPage from "../../routes/view";
import TeamGoldRankingPage from "../../team-gold-ranking/view";
import TeamLevelRankingPage from "../../team-level-ranking/view";

export type BrowserRoute = {
  path: string;
  label: string;
  element: ReactElement;
};

export const browserRoutes: BrowserRoute[] = [
  { path: "/", label: "In-Game Notification", element: <InGameNotificationPage /> },
  { path: "/in-game-notification", label: "In-Game Notification", element: <InGameNotificationPage /> },
  { path: "/broadcast/live-gold-ranking", label: "Broadcast Live Gold Ranking", element: <LiveGoldRankingPage /> },
  { path: "/boradcast/live-gold-ranking", label: "Broadcast Live Gold Ranking", element: <LiveGoldRankingPage /> },
  { path: "/broadcast/team-gold-ranking", label: "Broadcast Team Gold Ranking", element: <TeamGoldRankingPage /> },
  { path: "/broadcast/team-level-ranking", label: "Broadcast Team Level Ranking", element: <TeamLevelRankingPage /> },
  { path: "/broadcast/notification-alert", label: "Broadcast Notification Alert", element: <NotificationAlertPage /> },
  { path: "/broadcast/objective-notification-alert", label: "Broadcast Objective Notification Alert", element: <ObjectiveNotificationAlertPage /> },
  { path: "/broadcast/role-cameras", label: "Broadcast Role Cameras", element: <RoleCameraDuelPage /> },
  { path: "/broadcast/live-levels", label: "Broadcast Live Levels", element: <LivePlayerLevelsPage /> },
  { path: "/boradcast/live-levels", label: "Broadcast Live Levels", element: <LivePlayerLevelsPage /> },
  { path: "/live-player-levels", label: "Live Player Levels", element: <LivePlayerLevelsPage /> },
  { path: "/notification", label: "Notifications", element: <NotificationPage /> },
  { path: "/notiication", label: "Notifications", element: <NotificationPage /> },
  { path: "/routes", label: "Routes", element: <RoutesPage /> },
  { path: "/control", label: "Control", element: <ControlPage /> }
];

function resolveRoute(pathname: string) {
  return browserRoutes.find((route) => route.path === pathname) || browserRoutes[0];
}

export function AppRouter() {
  const activeRoute = resolveRoute(window.location.pathname);

  if (
    activeRoute.path === "/" ||
    activeRoute.path === "/in-game-notification" ||
    activeRoute.path === "/broadcast/live-gold-ranking" ||
    activeRoute.path === "/boradcast/live-gold-ranking" ||
    activeRoute.path === "/broadcast/team-gold-ranking" ||
    activeRoute.path === "/broadcast/team-level-ranking" ||
    activeRoute.path === "/broadcast/notification-alert" ||
    activeRoute.path === "/broadcast/objective-notification-alert" ||
    activeRoute.path === "/broadcast/role-cameras" ||
    activeRoute.path === "/broadcast/live-levels" ||
    activeRoute.path === "/boradcast/live-levels" ||
    activeRoute.path === "/live-player-levels"
  ) {
    return activeRoute.element;
  }

  return <Layout activePath={activeRoute.path}>{activeRoute.element}</Layout>;
}
