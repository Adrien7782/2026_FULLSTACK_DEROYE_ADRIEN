import { useState } from "react";
import { useSession } from "../auth/useSession";

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
      });

      setSuccessMessage("Profil mis a jour.");
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
            Gere ici les informations du compte, la confidentialite des likes et la
            session active.
          </p>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span className="status-label">Role</span>
            <strong>{user.role}</strong>
            <p>Seul un administrateur peut acceder aux routes `admin` plus tard.</p>
          </article>

          <article className="status-card">
            <span className="status-label">Session</span>
            <strong>Active</strong>
            <p>Expiration: {new Date(session.expiresAt).toLocaleString()}</p>
          </article>

          <article className="status-card">
            <span className="status-label">Device</span>
            <strong>{session.userAgent ? "Tracked" : "Unknown"}</strong>
            <p>{session.userAgent ?? "User-Agent non transmis"}</p>
          </article>
        </div>
      </div>

      <div className="profile-grid">
        <div className="panel">
          <p className="eyebrow">Informations</p>
          <h3>Mettre a jour le profil</h3>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>Username</span>
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
                <span>Prenom</span>
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
                <span>Avatar URL</span>
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
              <span>Masquer mes likes aux autres utilisateurs quand cette option sera active</span>
            </label>

            {(error || successMessage) && (
              <p className={error ? "form-error" : "form-success"}>{error || successMessage}</p>
            )}

            <div className="action-row">
              <button type="submit" className="primary-button" disabled={isBusy}>
                {isBusy ? "Sauvegarde..." : "Enregistrer"}
              </button>
              <button type="button" className="secondary-button" onClick={() => void refresh()}>
                Rotation de session
              </button>
            </div>
          </form>
        </div>

        <div className="panel">
          <p className="eyebrow">Securite</p>
          <h3>Sessions et compte</h3>
          <ul className="bullet-list">
            <li>Session creee le {new Date(session.createdAt).toLocaleString()}</li>
            <li>Derniere utilisation le {new Date(session.lastUsedAt).toLocaleString()}</li>
            <li>Compte cree le {new Date(user.createdAt).toLocaleDateString()}</li>
          </ul>

          <div className="stack-actions">
            <button type="button" className="secondary-button" onClick={() => void logout()}>
              Se deconnecter de cet appareil
            </button>
            <button type="button" className="danger-button" onClick={() => void logoutAll()}>
              Se deconnecter partout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
