import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MediaCard } from "../components/media/MediaCard";
import { getCatalogHome, type CatalogHomeResponse } from "../lib/api";
import { useUpload } from "../upload/useUpload";

export function HomePage() {
  const { catalogVersion } = useUpload();
  const [catalog, setCatalog] = useState<CatalogHomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const catalogPayload = await getCatalogHome();

        if (!isMounted) {
          return;
        }

        setCatalog(catalogPayload);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load the catalog");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [catalogVersion]);

  if (isLoading) {
    return (
      <section className="page-section">
        <div className="panel">
          <p className="eyebrow">Accueil</p>
          <h2>Chargement du catalogue</h2>
          <p className="muted">Le front recupere les ajouts recents et les genres disponibles.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="panel">
          <p className="eyebrow">Accueil</p>
          <h2>Le catalogue n&apos;a pas pu etre charge</h2>
          <p className="form-error">{error}</p>
          <Link className="secondary-link" to="/films">
            Ouvrir la page films
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="hero-card panel">
        <div className="home-hero">
          <div className="home-hero-copy">
            <p className="eyebrow">Accueil</p>
            <h2>Bienvenue sur StreamAdy</h2>
            <p className="muted">
              Parcourez rapidement les derniers films ajoutés, explorez par genre et
              accédez au catalogue complet sans passer par des écrans techniques.
            </p>
          </div>

          <div className="home-highlight-grid">
            <article className="highlight-card">
              <span className="status-label">Catalogue</span>
              <strong>{(catalog?.recent.length ?? 0) + (catalog?.spotlight ? 1 : 0)} films visibles</strong>
              <p>Les films publies sont directement consultables depuis la page Films.</p>
            </article>

            <article className="highlight-card">
              <span className="status-label">Genres</span>
              <strong>{catalog?.genres.length ?? 0} categories</strong>
              <p>Utilise les genres pour filtrer rapidement le catalogue.</p>
            </article>

            <article className="highlight-card">
              <span className="status-label">A l'affiche</span>
              <strong>{catalog?.spotlight?.title ?? "Aucun spotlight"}</strong>
              <p>
                {catalog?.spotlight
                  ? "Le film mis en avant apparait ci-dessous, sans prendre toute la home."
                  : "Le bloc spotlight s'activera automatiquement dès qu'un film sera disponible."}
              </p>
            </article>
          </div>
        </div>
      </div>

      {catalog?.spotlight && (
        <div className="panel spotlight-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Mis en avant</p>
              <h3>{catalog.spotlight.title}</h3>
              <p className="muted">{catalog.spotlight.synopsis}</p>
            </div>

            <div className="action-row">
              <Link className="primary-link" to={`/films/${catalog.spotlight.slug}`}>
                Voir la fiche
              </Link>
              <Link className="secondary-link" to="/films">
                Voir tout le catalogue
              </Link>
            </div>
          </div>

          <div className="chip-row">
            {catalog.spotlight.genres.map((genre) => (
              <Link key={genre.id} to={`/films?genre=${genre.slug}`} className="genre-chip is-link">
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Ajouts recents</p>
            <h3>Les derniers films du catalogue</h3>
          </div>
          <Link className="secondary-link" to="/films">
            Tout voir
          </Link>
        </div>

        {catalog && catalog.recent.length > 0 ? (
          <div className="media-grid">
            {catalog.recent.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="muted">Aucun film publie pour l'instant.</p>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Genres</p>
            <h3>Commencer par une categorie</h3>
          </div>
        </div>

        {catalog && catalog.genres.length > 0 ? (
          <div className="genre-grid">
            {catalog.genres.map((genre) => (
              <Link key={genre.id} to={`/films?genre=${genre.slug}`} className="genre-tile">
                <strong>{genre.name}</strong>
                <span>{genre.mediaCount} film(s)</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="muted">Les genres apparaitront ici des que le catalogue contiendra des films.</p>
          </div>
        )}
      </div>
    </section>
  );
}
