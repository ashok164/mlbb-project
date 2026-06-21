import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Bell, Coins, ListTree, Rows3, SlidersHorizontal, Sparkles } from "lucide-react";

const BROADCAST_THEME_STORAGE_KEY = "broadcast-theme";
const BROADCAST_THEME_CHANGE_EVENT = "broadcast-theme-change";
type BroadcastTheme = "theme1" | "theme2";

const navItems = [
  { path: "/in-game-notification", label: "In-Game" },
  { path: "/broadcast/live-gold-ranking", label: "Gold Ranking" },
  { path: "/broadcast/team-gold-ranking", label: "Team Gold" },
  { path: "/broadcast/team-level-ranking", label: "Team Level" },
  { path: "/broadcast/notification-alert", label: "Alert" },
  { path: "/broadcast/objective-notification-alert", label: "Objective Alert" },
  { path: "/broadcast/live-levels", label: "Broadcast Levels" },
  { path: "/notification", label: "Notifications" },
  { path: "/routes", label: "Routes" },
  { path: "/control", label: "Control" }
];

const icons: Record<string, ReactElement> = {
  "/in-game-notification": <Sparkles size={18} />,
  "/broadcast/live-gold-ranking": <Coins size={18} />,
  "/broadcast/team-gold-ranking": <Coins size={18} />,
  "/broadcast/team-level-ranking": <Rows3 size={18} />,
  "/broadcast/notification-alert": <Sparkles size={18} />,
  "/broadcast/objective-notification-alert": <Sparkles size={18} />,
  "/broadcast/live-levels": <Rows3 size={18} />,
  "/notification": <Bell size={18} />,
  "/routes": <ListTree size={18} />,
  "/control": <SlidersHorizontal size={18} />
};

type Props = {
  activePath: string;
  children: ReactNode;
};

export function Layout({ activePath, children }: Props) {
  const [broadcastTheme, setBroadcastTheme] = useState<BroadcastTheme>("theme1");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(BROADCAST_THEME_STORAGE_KEY);
    if (storedTheme === "theme2") {
      setBroadcastTheme("theme2");
    }
  }, []);

  const updateBroadcastTheme = (theme: BroadcastTheme) => {
    setBroadcastTheme(theme);
    window.localStorage.setItem(BROADCAST_THEME_STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent(BROADCAST_THEME_CHANGE_EVENT, { detail: theme }));
  };

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
        <section className="theme-panel" aria-label="Broadcast theme selector">
          <span className="theme-panel-label">Broadcast Theme</span>
          <div className="theme-switch" role="radiogroup" aria-label="Broadcast theme">
            <button
              className={broadcastTheme === "theme1" ? "theme-option active" : "theme-option"}
              type="button"
              onClick={() => updateBroadcastTheme("theme1")}
              aria-pressed={broadcastTheme === "theme1"}
            >
              Theme 1
            </button>
            <button
              className={broadcastTheme === "theme2" ? "theme-option active" : "theme-option"}
              type="button"
              onClick={() => updateBroadcastTheme("theme2")}
              aria-pressed={broadcastTheme === "theme2"}
            >
              Theme 2
            </button>
          </div>
        </section>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
