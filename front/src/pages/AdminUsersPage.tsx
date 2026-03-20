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

  const handleRoleToggle = async (user: AdminUser) => {
    const newRole: UserRole = user.role === "admin" ? "standard" : "admin";
    setUpdating((prev) => ({ ...prev, [user.id]: true }));
    try {
      await updateUserRole(user.id, newRole);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour.");
      setUpdating((prev) => ({ ...prev, [user.id]: false }));
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
        </div>

        {isLoading && <p className="muted">Chargement…</p>}
        {error && <p className="form-error">{error}</p>}

        {!isLoading && !error && users.length === 0 && (
          <div className="empty-state">
            <p className="muted">Aucun utilisateur trouvé.</p>
          </div>
        )}

        {users.length > 0 && (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Nom d&apos;utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Favoris</th>
                  <th>Notes</th>
                  <th>Suggestions</th>
                  <th>Inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const initials = u.username.charAt(0).toUpperCase();
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="nav-user-avatar nav-user-avatar--sm">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.username} />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{u.username}</strong>
                        {isSelf && <span className="muted"> (vous)</span>}
                      </td>
                      <td className="muted">{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "badge-blue" : "badge-grey"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="muted">{u._count.favorites}</td>
                      <td className="muted">{u._count.ratings}</td>
                      <td className="muted">{u._count.suggestions}</td>
                      <td className="muted">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => void handleRoleToggle(u)}
                          disabled={isSelf || updating[u.id]}
                          title={isSelf ? "Impossible de modifier son propre rôle" : undefined}
                        >
                          {u.role === "admin" ? "Rétrograder" : "Promouvoir admin"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
