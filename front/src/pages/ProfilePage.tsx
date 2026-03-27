import { useState } from "react";
import { useSession } from "../auth/useSession";
import { ThemeToggle } from "../components/ThemeToggle";

export function ProfilePage() {
  const { user, session } = useSession();

  if (!user || !session) {
    return null;
  }

  return <ProfileEditor key={user.id} user={user} session={session} />;
}

type ProfileEditorProps = {
  user: NonNullable<ReturnType<typeof useSession>["user"]>;
  session: NonNullable<ReturnType<typeof useSession>["session"]>;
};

function ProfileEditor({ user, session }: ProfileEditorProps) {
  const { updateProfile, logout, logoutAll, refresh, isBusy, error, clearError } =
    useSession();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [isLikesPrivate, setIsLikesPrivate] = useState(user.isLikesPrivate);
  const [isPublic, setIsPublic] = useState(user.isPublic);
  const [notifyOnNewMedia, setNotifyOnNewMedia] = useState(user.notifyOnNewMedia);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSuccessMessage("");

    try {
      await updateProfile({
        username,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        avatarUrl: avatarUrl || null,
        isLikesPrivate,
        isPublic,
        notifyOnNewMedia,
      });

      setSuccessMessage("Profil mis à jour.");
    } catch {
      return;
    }
  };

  return (
    <section className="page-section">
      <div className="hero-card panel">
        <div>
          <p className="eyebrow">Profil</p>
          <h2>{user.firstName ?? user.username}</h2>
          <p className="muted">
            Gérez ici les informations du compte, la confidentialité des likes et la
            session active.
          </p>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span className="status-label">Rôle</span>
            <strong>{user.role}</strong>
            <p>Seul un administrateur peut accéder aux routes admin.</p>
          </article>

          <article className="status-card">
            <span className="status-label">Session</span>
            <strong>Active</strong>
            <p>Expiration : {new Date(session.expiresAt).toLocaleString()}</p>
          </article>

          <article className="status-card">
            <span className="status-label">Appareil</span>
            <strong>{session.userAgent ? "Identifié" : "Inconnu"}</strong>
            <p>{session.userAgent ?? "User-Agent non transmis"}</p>
          </article>
        </div>
      </div>

      <div className="profile-grid">
        <div className="panel">
          <p className="eyebrow">Informations</p>
          <h3>Mettre à jour le profil</h3>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>Nom d&apos;utilisateur</span>
                <input value={username} onChange={(event) => setUsername(event.target.value)} />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label>
                <span>Prénom</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>

              <label>
                <span>Nom</span>
                <input value={lastName} onChange={(event) => setLastName(event.target.value)} />
              </label>

              <label className="full-width">
                <span>URL de l&apos;avatar</span>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={isLikesPrivate}
                onChange={(event) => setIsLikesPrivate(event.target.checked)}
              />
              <span>Masquer mes likes aux autres utilisateurs</span>
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
              />
              <span>Profil public (visible et suivable par tous)</span>
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={notifyOnNewMedia}
                onChange={(event) => setNotifyOnNewMedia(event.target.checked)}
              />
              <span>Me notifier lors de l&apos;ajout de médias sur la plateforme</span>
            </label>

            {(error || successMessage) && (
              <p className={error ? "form-error" : "form-success"}>{error || successMessage}</p>
            )}

            <div className="action-row">
              <button type="submit" className="primary-button" disabled={isBusy}>
                {isBusy ? "Sauvegarde..." : "Enregistrer"}
              </button>
              <button type="button" className="secondary-button" onClick={() => void refresh()}>
                Renouveler la session
              </button>
            </div>
          </form>
        </div>

        <div className="panel">
          <p className="eyebrow">Sécurité</p>
          <h3>Sessions et compte</h3>
          <ul className="bullet-list">
            <li>Session créée le {new Date(session.createdAt).toLocaleString()}</li>
            <li>Dernière utilisation le {new Date(session.lastUsedAt).toLocaleString()}</li>
            <li>Compte créé le {new Date(user.createdAt).toLocaleDateString()}</li>
          </ul>

          <div className="stack-actions">
            <button type="button" className="secondary-button" onClick={() => void logout()}>
              Se déconnecter de cet appareil
            </button>
            <button type="button" className="danger-button" onClick={() => void logoutAll()}>
              Se déconnecter partout
            </button>
          </div>

          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
            <p className="eyebrow">Apparence</p>
            <h3 style={{ marginBottom: "14px" }}>Thème de l&apos;interface</h3>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </section>
  );
}
