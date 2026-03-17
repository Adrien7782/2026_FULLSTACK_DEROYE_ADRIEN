import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { ThemeToggle } from "../components/ThemeToggle";
import { getDocsUrl } from "../lib/api";

export function AppLayout() {
  const { user, isAuthenticated, isBusy, logout } = useSession();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <p className="eyebrow">StreamAdy</p>
          <h1>Phase 1</h1>
          <p className="muted">
            Application privee avec authentification `username/password`, session
            persistante et profil utilisateur.
          </p>
        </div>

        <nav className="app-nav" aria-label="Primary navigation">
          {isAuthenticated ? (
            <>
              <NavLink to="/" end>
                Accueil
              </NavLink>
              <NavLink to="/films">Films</NavLink>
              <NavLink to="/profile">Profil</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login">Connexion</NavLink>
              <NavLink to="/register">Inscription</NavLink>
            </>
          )}
          <a href={getDocsUrl()} target="_blank" rel="noreferrer">
            Docs API
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="account-card">
            <p className="account-title">{isAuthenticated ? "Session active" : "Acces public"}</p>
            <strong>{isAuthenticated ? user?.username : "Visiteur"}</strong>
            <p className="muted">
              {isAuthenticated
                ? `${user?.role} - ${user?.email}`
                : "Connecte-toi pour ouvrir les pages protegees."}
            </p>

            {isAuthenticated && (
              <button
                type="button"
                className="secondary-button full-width"
                onClick={() => void logout()}
                disabled={isBusy}
              >
                Se deconnecter
              </button>
            )}
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
