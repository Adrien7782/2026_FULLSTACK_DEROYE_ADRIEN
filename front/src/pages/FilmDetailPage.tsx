import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MediaCard } from "../components/media/MediaCard";
import {
  getMediaDetail,
  getMediaPosterUrl,
  getMediaStreamUrl,
  type MediaDetailResponse,
} from "../lib/api";

const getFallbackLabel = (title: string) =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

export function FilmDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [detail, setDetail] = useState<MediaDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      if (!slug) {
        setError("Media slug is missing");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const payload = await getMediaDetail(slug);

        if (isMounted) {
          setDetail(payload);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load media detail");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <section className="page-section">
        <div className="panel">
          <p className="eyebrow">Film</p>
          <h2>Chargement de la fiche</h2>
          <p className="muted">La fiche detaillee est en cours de recuperation.</p>
        </div>
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="page-section">
        <div className="panel">
          <p className="eyebrow">Film</p>
          <h2>Impossible d&apos;ouvrir cette fiche</h2>
          <p className="form-error">{error || "Media not found"}</p>
          <Link className="secondary-link" to="/films">
            Retour au catalogue
          </Link>
        </div>
      </section>
    );
  }

  const { item, related } = detail;
  const streamUrl = getMediaStreamUrl(item.slug);
  const posterUrl = getMediaPosterUrl(item.slug);

  return (
    <section className="page-section">
      <div className="panel detail-hero">
        <div className="detail-hero-content">
          <p className="eyebrow">Fiche film</p>
          <h2>{item.title}</h2>
          <p className="muted">{item.synopsis}</p>

          <div className="chip-row">
            {item.genres.map((genre) => (
              <Link key={genre.id} to={`/films?genre=${genre.slug}`} className="genre-chip is-link">
                {genre.name}
              </Link>
            ))}
          </div>

          <div className="detail-meta-grid">
            <div className="status-card">
              <span className="status-label">Annee</span>
              <strong>{item.releaseYear ?? "Inconnue"}</strong>
              <p>Date de sortie renseignee dans le catalogue.</p>
            </div>

            <div className="status-card">
              <span className="status-label">Duree</span>
              <strong>{item.durationMinutes ? `${item.durationMinutes} min` : "Inconnue"}</strong>
              <p>
                {item.hasVideo
                  ? "Le fichier local est pret a etre diffuse via l'API."
                  : "Ajoute un fichier video local pour activer la lecture."}
              </p>
            </div>

            <div className="status-card">
              <span className="status-label">Position</span>
              <strong>#{item.stats.catalogPosition}</strong>
              <p>{item.stats.genreCount} genre(s) associe(s) a cette fiche.</p>
            </div>
          </div>

          <div className="action-row">
            <Link className="primary-link" to="/films">
              Retour au catalogue
            </Link>
            {item.hasVideo ? (
              <a className="secondary-link" href={streamUrl} target="_blank" rel="noreferrer">
                Ouvrir le flux video
              </a>
            ) : (
              <button type="button" className="secondary-button" disabled>
                Video locale absente
              </button>
            )}
          </div>
        </div>

        <div className="detail-poster">
          {item.hasPoster ? (
            <img src={posterUrl} alt={`Affiche de ${item.title}`} />
          ) : (
            <div className="media-card-fallback is-large" aria-hidden="true">
              <span>{getFallbackLabel(item.title)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Informations</p>
            <h3>Resume du media</h3>
          </div>
        </div>

        <div className="detail-summary-grid">
          <div className="detail-summary-copy">
            <p>{item.synopsis}</p>
            <p className="muted">
              Cree le {new Date(item.createdAt).toLocaleDateString()} - mis a jour le{" "}
              {new Date(item.updatedAt).toLocaleDateString()}.
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">A voir ensuite</p>
            <h3>Films lies</h3>
          </div>
        </div>

        {related.length > 0 ? (
          <div className="media-grid">
            {related.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="muted">Aucun autre film partageant ces genres pour le moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
