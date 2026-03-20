import { Navigate, Link } from "react-router-dom";
import { useSession } from "../auth/useSession";

export function AdminPage() {
  const { user } = useSession();

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="page-section">
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Espace administrateur</p>
            <h2>Administration</h2>
          </div>
        </div>

        <div className="admin-cards">
          <Link to="/admin/suggestions" className="admin-card panel">
            <h3>Suggestions</h3>
            <p className="muted">Gérer les suggestions de films des utilisateurs.</p>
          </Link>

          <Link to="/admin/users" className="admin-card panel">
            <h3>Utilisateurs</h3>
            <p className="muted">Gérer les comptes et les rôles des utilisateurs.</p>
          </Link>

          <Link to="/admin/media" className="admin-card panel">
            <h3>Médias</h3>
            <p className="muted">Gérer les films et séries du catalogue.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
