import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">404</p>
        <h2>Page introuvable</h2>
        <p className="muted">
          Cette route n&apos;existe pas encore dans le shell de l&apos;application.
        </p>
        <Link className="primary-link" to="/">
          Retour a l&apos;accueil
        </Link>
      </div>
    </section>
  );
}
