export function LoginPage() {
  return (
    <section className="page-section">
      <div className="panel auth-panel">
        <div>
          <p className="eyebrow">Phase 1</p>
          <h2>Ecran de connexion</h2>
          <p className="muted">
            La vraie authentification `username/password` commencera en phase 1. Cette
            page sert pour l&apos;instant de squelette d&apos;integration.
          </p>
        </div>

        <form className="auth-form">
          <label>
            <span>Username</span>
            <input type="text" placeholder="adrien" disabled />
          </label>

          <label>
            <span>Password</span>
            <input type="password" placeholder="********" disabled />
          </label>

          <button type="button" className="primary-button" disabled>
            Connexion a venir
          </button>
        </form>
      </div>
    </section>
  );
}
