import { getControlRoutes, getOverlayRoutes } from "../repository/remote";

export function useRoutesController() {
  const controlRoutes = getControlRoutes();
  const overlayRoutes = getOverlayRoutes();

  const openOverlay = (path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  return { controlRoutes, overlayRoutes, openOverlay };
}
