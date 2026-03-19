import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { GlobalUploadIndicator } from "../components/upload/GlobalUploadIndicator";
import { getDocsUrl } from "../lib/api";

export function AppLayout() {
  const { user, isAuthenticated, isBusy, logout } = useSession();
  const initials = user?.username?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <p className="eyebrow">StreamAdy</p>
          <h1>Phase 4</h1>
          <p className="muted">
            Favoris, liste de lecture, notes et historique.
          </p>
        </div>

        <nav className="app-nav" aria-label="Navigation principale">
          {isAuthenticated ? (
            <>
              <NavLink to="/" end>Accueil</NavLink>
              <NavLink to="/films">Films</NavLink>
              <NavLink to="/favorites">Favoris</NavLink>
              <NavLink to="/watchlist">Ma liste</NavLink>
              <NavLink to="/history">Historique</NavLink>
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
          {isAuthenticated && user ? (
            <div className="sidebar-user">
              <div className="sidebar-user-header">
                <div className="nav-user-avatar">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{initials}</span>}
                </div>
                <div className="nav-user-info">
                  <span className="nav-user-name">{user.username}</span>
                  <span className={`nav-user-role role-${user.role}`}>{user.role}</span>
                </div>
              </div>
              <button
                type="button"
                className="secondary-button full-width"
                onClick={() => void logout()}
                disabled={isBusy}
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <div className="account-card">
              <p className="account-title">Accès public</p>
              <p className="muted">Connecte-toi pour accéder aux pages protégées.</p>
            </div>
          )}
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>

      <GlobalUploadIndicator />
    </div>
  );
}
