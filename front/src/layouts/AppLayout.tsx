import { NavLink, Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";
import { getApiBaseUrl } from "../lib/api";

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <p className="eyebrow">StreamAdy</p>
          <h1>Phase 0</h1>
          <p className="muted">
            Shell d&apos;application pour valider le socle front, le routage et la
            communication API.
          </p>
        </div>

        <nav className="app-nav" aria-label="Primary navigation">
          <NavLink to="/" end>
            Accueil
          </NavLink>
          <NavLink to="/login">Connexion</NavLink>
          <a href={`${getApiBaseUrl()}/docs`} target="_blank" rel="noreferrer">
            Docs API
          </a>
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
