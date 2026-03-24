import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isBusy, error, clearError } = useSession();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await register({
        username,
        email,
        password,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      navigate("/");
    } catch {
      return;
    }
  };

  return (
    <section className="auth-page">
      <div className="panel auth-panel">
        <div>
          <p className="eyebrow">Inscription</p>
          <h2>Créer un compte</h2>
          <p className="muted">
            Le compte crée une session persistante en base et ouvre immédiatement
            l&apos;application privée.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Nom d&apos;utilisateur</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="adrien"
                autoComplete="username"
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="toi@streamady.dev"
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>Prénom</span>
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Adrien"
              />
            </label>

            <label>
              <span>Nom</span>
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Deroye"
              />
            </label>

            <label>
              <span>Mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 caractères"
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              <span>Confirmation</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Retape le mot de passe"
                autoComplete="new-password"
                required
              />
            </label>
          </div>

          {(localError || error) && <p className="form-error">{localError || error}</p>}

          <div className="action-row">
            <button type="submit" className="primary-button" disabled={isBusy}>
              {isBusy ? "Création..." : "Créer le compte"}
            </button>
            <Link className="secondary-link" to="/login">
              Déjà un compte ?
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
