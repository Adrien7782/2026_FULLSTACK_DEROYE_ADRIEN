import { useEffect, useState } from "react";
import { getApiBaseUrl, getHealth, type HealthResponse } from "../lib/api";

export function HomePage() {
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
          <p className="eyebrow">Socle technique</p>
          <h2>Front, back et base de donnees communiquent</h2>
          <p className="muted">
            Cette page valide la connexion au backend, l&apos;acces a PostgreSQL via
            Prisma et le shell React de l&apos;application.
          </p>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span className="status-label">Frontend</span>
            <strong>Running</strong>
            <p>React Router, layout principal et theme sont en place.</p>
          </article>

          <article className="status-card">
            <span className="status-label">Backend</span>
            <strong>{error ? "Unavailable" : "Running"}</strong>
            <p>Base API: {getApiBaseUrl()}</p>
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
          <a className="secondary-link" href={`${getApiBaseUrl()}/docs`} target="_blank" rel="noreferrer">
            Ouvrir la doc API
          </a>
        </div>
      </div>

      <div className="info-grid">
        <article className="panel">
          <p className="eyebrow">Sprint 0.1</p>
          <h3>Initialisation</h3>
          <ul className="bullet-list">
            <li>Docker Compose avec `db`, `backend`, `frontend`</li>
            <li>Variables d&apos;environnement d&apos;exemple</li>
            <li>README de bootstrap local</li>
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">Sprint 0.2</p>
          <h3>Architecture</h3>
          <ul className="bullet-list">
            <li>Prisma configure et migrations operationnelles</li>
            <li>Backend structure par modules metier</li>
            <li>OpenAPI / docs accessibles</li>
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">Frontend shell</p>
          <h3>Application ready</h3>
          <ul className="bullet-list">
            <li>React Router actif</li>
            <li>Layout principal avec navigation</li>
            <li>Theme light / dark / system</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
