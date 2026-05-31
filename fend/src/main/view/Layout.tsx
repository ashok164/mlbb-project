import type { ReactElement, ReactNode } from "react";
import { Bell, ListTree, SlidersHorizontal, Sparkles } from "lucide-react";

const navItems = [
  { path: "/in-game-notification", label: "In-Game" },
  { path: "/notification", label: "Notifications" },
  { path: "/routes", label: "Routes" },
  { path: "/control", label: "Control" }
];

const icons: Record<string, ReactElement> = {
  "/in-game-notification": <Sparkles size={18} />,
  "/notification": <Bell size={18} />,
  "/routes": <ListTree size={18} />,
  "/control": <SlidersHorizontal size={18} />
};

type Props = {
  activePath: string;
  children: ReactNode;
};

export function Layout({ activePath, children }: Props) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">VM</span>
          <div>
            <strong>vMix Data</strong>
            <span>Frontend</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <a
              className={activePath === item.path ? "nav-link active" : "nav-link"}
              href={item.path}
              key={item.path}
              title={item.label}
            >
              {icons[item.path]}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
