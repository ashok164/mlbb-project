import { ExternalLink, MonitorUp, Server } from "lucide-react";
import type { OverlayRouteLink, RouteLink } from "../repository/remote";

type Props = {
  controlRoutes: RouteLink[];
  overlayRoutes: OverlayRouteLink[];
  openOverlay: (path: string) => void;
};

export function RoutesView({ controlRoutes, overlayRoutes, openOverlay }: Props) {
  return (
    <section className="page route-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Navigation Registry</p>
          <h1>Routes</h1>
        </div>
      </header>

      <div className="routes-workspace">
        <section className="route-section">
          <div className="section-title">
            <Server size={18} />
            <h2>Control and API Routes</h2>
            <span>{controlRoutes.length}</span>
          </div>
          <div className="route-list">
            {controlRoutes.map((route) => (
              <a className="route-row" href={route.url} key={`${route.method}-${route.path}`} target="_blank" rel="noreferrer">
                <span className={`method ${route.method.toLowerCase()}`}>{route.method}</span>
                <strong>{route.label}</strong>
                <code>{route.path}</code>
                <small>{route.description}</small>
              </a>
            ))}
          </div>
        </section>

        <section className="route-section">
          <div className="section-title">
            <MonitorUp size={18} />
            <h2>Overlay Broadcast Controls</h2>
            <span>{overlayRoutes.length}</span>
          </div>
          <div className="route-list">
            {overlayRoutes.map((route) => (
              <button className="route-row overlay-route" key={route.path} onClick={() => openOverlay(route.url)}>
                <span className="method overlay">OPEN</span>
                <strong>{route.label}</strong>
                <code>{route.path}</code>
                <small>{route.description}</small>
                <ExternalLink size={16} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
