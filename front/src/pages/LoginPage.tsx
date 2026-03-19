import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";

type RedirectState = {
  from?: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isBusy, error, clearError } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const redirectState = location.state as RedirectState | null;
  const redirectTo = redirectState?.from ?? "/";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    try {
      await login({ username, password });
      navigate(redirectTo, { replace: true });
    } catch {
      return;
    }
  };

  return (
    <section className="page-section">
      <div className="panel auth-panel">
        <div>
          <p className="eyebrow">Authentification</p>
          <h2>Connexion</h2>
          <p className="muted">
            La session est basée sur un cookie HTTP-only et une entrée persistante dans
            PostgreSQL.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Nom d&apos;utilisateur</span>
            <input
              type="text"
              placeholder="adrien"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Mot de passe</span>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="action-row">
            <button type="submit" className="primary-button" disabled={isBusy}>
              {isBusy ? "Connexion..." : "Se connecter"}
            </button>
            <Link className="secondary-link" to="/register">
              Créer un compte
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
