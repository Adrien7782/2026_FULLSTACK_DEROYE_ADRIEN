import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import {
  listAdminUsers,
  updateUserRole,
  type AdminUser,
  type UserRole,
} from "../lib/api";

export function AdminUsersPage() {
  const { user: currentUser } = useSession();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const load = () => {
    setIsLoading(true);
    setError("");
    listAdminUsers()
      .then((res) => setUsers(res.users))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleRoleToggle = async (u: AdminUser) => {
    const newRole: UserRole = u.role === "admin" ? "standard" : "admin";
    setUpdating((prev) => ({ ...prev, [u.id]: true }));
    try {
      await updateUserRole(u.id, newRole);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour.");
      setUpdating((prev) => ({ ...prev, [u.id]: false }));
    }
  };

  return (
    <section className="page-section">
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h2>Gestion des utilisateurs</h2>
          </div>
          <span className="user-count-badge">{users.length} utilisateur{users.length !== 1 ? "s" : ""}</span>
        </div>

        {isLoading && <p className="muted">Chargement…</p>}
        {error && <p className="form-error">{error}</p>}

        {!isLoading && !error && users.length === 0 && (
          <div className="empty-state">
            <p className="muted">Aucun utilisateur trouvé.</p>
          </div>
        )}

        {users.length > 0 && (
          <div className="user-cards">
            {users.map((u) => {
              const initials = u.username.charAt(0).toUpperCase();
              const isSelf = u.id === currentUser?.id;
              return (
                <div key={u.id} className="user-card">
                  <div className="user-card-top">
                    <div className="user-card-avatar">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="user-card-identity">
                      <strong className="user-card-name">
                        {u.username}
                        {isSelf && <span className="user-card-self"> (vous)</span>}
                      </strong>
                      <span className="user-card-email">{u.email}</span>
                    </div>
                    <span className={`user-role-badge ${u.role === "admin" ? "is-admin" : "is-standard"}`}>
                      {u.role === "admin" ? "Admin" : "Standard"}
                    </span>
                  </div>

                  <div className="user-card-stats">
                    <div className="user-stat">
                      <span className="user-stat-value">{u._count.favorites}</span>
                      <span className="user-stat-label">Favoris</span>
                    </div>
                    <div className="user-stat">
                      <span className="user-stat-value">{u._count.ratings}</span>
                      <span className="user-stat-label">Notes</span>
                    </div>
                    <div className="user-stat">
                      <span className="user-stat-value">{u._count.suggestions}</span>
                      <span className="user-stat-label">Suggestions</span>
                    </div>
                    <div className="user-stat">
                      <span className="user-stat-value">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="user-stat-label">Inscription</span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <button
                      type="button"
                      className={u.role === "admin" ? "secondary-button" : "primary-button"}
                      onClick={() => void handleRoleToggle(u)}
                      disabled={isSelf || updating[u.id]}
                      title={isSelf ? "Impossible de modifier son propre rôle" : undefined}
                    >
                      {updating[u.id] ? "…" : u.role === "admin" ? "Rétrograder" : "Promouvoir admin"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
