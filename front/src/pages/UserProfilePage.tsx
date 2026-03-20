import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUserPublicProfile } from "../lib/api";

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<{ id: string; username: string; avatarUrl: string | null; createdAt: string } | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    getUserPublicProfile(username)
      .then((res) => setUser(res.user))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  }, [username]);

  const initials = user?.username.charAt(0).toUpperCase() ?? "?";

  if (isLoading) return (
    <section className="page-section">
      <div className="panel"><p className="muted">Chargement…</p></div>
    </section>
  );

  if (error || !user) return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Profil</p>
        <h2>Utilisateur introuvable</h2>
        <p className="form-error">{error || "Cet utilisateur n'existe pas."}</p>
        <Link className="secondary-link" to="/films">Retour au catalogue</Link>
      </div>
    </section>
  );

  return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Profil public</p>
        <div className="public-profile">
          <div className="public-profile-avatar">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.username} />
              : <span>{initials}</span>}
          </div>
          <div>
            <h2>{user.username}</h2>
            <p className="muted">
              Membre depuis {new Date(user.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
