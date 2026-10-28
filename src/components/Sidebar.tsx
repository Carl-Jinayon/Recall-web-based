import type { Page, Theme } from "../types";
import { Icon, type IconName } from "./Icon";

interface SidebarProps {
  page: Page;
  dueCount: number;
  theme: Theme;
  onNavigate: (page: Page) => void;
  onToggleTheme: () => void;
}

const navigation: { page: Page; label: string; icon: IconName }[] = [
  { page: "dashboard", label: "Dashboard", icon: "dashboard" },
  { page: "library", label: "Library", icon: "library" },
  { page: "upcoming", label: "Upcoming", icon: "calendar" },
  { page: "progress", label: "Progress", icon: "chart" },
  { page: "settings", label: "Settings", icon: "settings" },
];

export function Sidebar({
  page,
  dueCount,
  theme,
  onNavigate,
  onToggleTheme,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="brand-copy">
          <strong>Recall</strong>
          <span>Spaced review</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <button
            key={item.page}
            type="button"
            className={`nav-item${page === item.page ? " is-active" : ""}`}
            onClick={() => onNavigate(item.page)}
            aria-current={page === item.page ? "page" : undefined}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
            {item.page === "dashboard" && dueCount > 0 ? (
              <span className="nav-badge">{dueCount}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-note">
          <Icon name="clock" size={16} />
          <p>
            Reviews run on <strong>1 · 3 · 7 · 15 · 30</strong> days.
          </p>
        </div>
        <button
          type="button"
          className="theme-button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
        <p className="storage-note">Progress stays in this browser.</p>
      </div>
    </aside>
  );
}
