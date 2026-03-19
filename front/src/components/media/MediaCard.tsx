import { Link } from "react-router-dom";
import { getMediaPosterUrl, type MediaCardItem } from "../../lib/api";

type MediaCardProps = {
  media: MediaCardItem;
};

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const getFallbackLabel = (title: string) =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

export function MediaCard({ media }: MediaCardProps) {
  const year = media.releaseYear ? String(media.releaseYear) : "Annee inconnue";
  const duration = media.durationMinutes ? `${media.durationMinutes} min` : "Duree inconnue";
  const statusLabel =
    media.status === "draft"
      ? "Brouillon"
      : media.status === "archived"
        ? "Archive"
        : "Publie";

  return (
    <article className="media-card">
      <Link className="media-card-link" to={`/films/${media.slug}`}>
        <div className="media-card-visual">
          {media.hasPoster ? (
            <img
              src={getMediaPosterUrl(media.slug)}
              alt={`Affiche de ${media.title}`}
              loading="lazy"
            />
          ) : (
            <div className="media-card-fallback" aria-hidden="true">
              <span>{getFallbackLabel(media.title)}</span>
            </div>
          )}
        </div>

        <div className="media-card-body">
          <div className="media-card-header">
            <h3>{media.title}</h3>
            <span className={`media-status-badge is-${media.status}`}>{statusLabel}</span>
            <p className="muted">
              {year} / {duration}
            </p>
          </div>

          <div className="chip-row">
            {media.genres.slice(0, 3).map((genre) => (
              <span key={genre.id} className="genre-chip">
                {genre.name}
              </span>
            ))}
          </div>

          <p className="media-card-copy">{truncate(media.synopsis, 140)}</p>
        </div>
      </Link>
    </article>
  );
}
