import { useEffect, useState } from "react";
import { useSession } from "../auth/useSession";
import { getApiOrigin, getHealth, type HealthResponse } from "../lib/api";

export function HomePage() {
  const { user, session, refresh, isBusy } = useSession();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHealth = async () => {
    setIsLoading(true);
    setError("");

    try {
      const nextHealth = await getHealth();
      setHealth(nextHealth);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown API error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  return (
    <section className="page-section">
      <div className="hero-card panel">
        <div>
          <p className="eyebrow">Phase 1</p>
          <h2>Bienvenue {user?.firstName ?? user?.username}</h2>
          <p className="muted">
            Le shell est maintenant prive. La session est active et le front peut
            consommer les routes protegees du backend.
          </p>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span className="status-label">Utilisateur</span>
            <strong>{user?.role}</strong>
            <p>{user?.email}</p>
          </article>

          <article className="status-card">
            <span className="status-label">Session</span>
            <strong>{session ? "Open" : "Unknown"}</strong>
            <p>Expire le {session ? new Date(session.expiresAt).toLocaleString() : "-"}</p>
          </article>

          <article className="status-card">
            <span className="status-label">Database</span>
            <strong>
              {isLoading ? "Checking" : health?.database === "up" ? "Connected" : "Unknown"}
            </strong>
            <p>
              {isLoading
                ? "Verification en cours."
                : error
                  ? error
                  : `Derniere verification: ${new Date(health?.timestamp ?? "").toLocaleString()}`}
            </p>
          </article>
        </div>

        <div className="action-row">
          <button type="button" className="primary-button" onClick={() => void loadHealth()}>
            Relancer le check API
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void refresh()}
            disabled={isBusy}
          >
            Tourner la session
          </button>
          <a className="secondary-link" href={`${getApiOrigin()}/docs`} target="_blank" rel="noreferrer">
            Ouvrir la doc API
          </a>
        </div>
      </div>

      <div className="info-grid">
        <article className="panel">
          <p className="eyebrow">Sprint 1.1</p>
          <h3>Authentification</h3>
          <ul className="bullet-list">
            <li>Inscription et connexion `username/password`</li>
            <li>Cookie de session HTTP-only</li>
            <li>Sessions persistantes par appareil</li>
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">Sprint 1.2</p>
          <h3>Securisation</h3>
          <ul className="bullet-list">
            <li>`GET /me`, `PATCH /me`, `logout`, `logout-all`</li>
            <li>Routes protegees et guard frontend</li>
            <li>Rate limiting et logging backend</li>
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">API</p>
          <h3>Etat runtime</h3>
          <ul className="bullet-list">
            <li>Origine API: {getApiOrigin()}</li>
            <li>Base: {error ? "indisponible" : "operationnelle"}</li>
            <li>Docs: `/docs` accessibles</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
