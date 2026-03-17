import { Link } from "react-router-dom";
import type { MediaCardItem } from "../../lib/api";

type MediaCardProps = {
  media: MediaCardItem;
};

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

export function MediaCard({ media }: MediaCardProps) {
  const year = media.releaseYear ? String(media.releaseYear) : "Annee inconnue";
  const duration = media.durationMinutes ? `${media.durationMinutes} min` : "Duree inconnue";

  return (
    <article className="media-card">
      <Link className="media-card-link" to={`/films/${media.slug}`}>
        <div className="media-card-visual">
          {media.posterUrl ? (
            <img src={media.posterUrl} alt={`Affiche de ${media.title}`} />
          ) : (
            <div className="media-card-fallback" aria-hidden="true">
              <span>{media.title.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="media-card-body">
          <div className="media-card-header">
            <h3>{media.title}</h3>
            <p className="muted">
              {year} · {duration}
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
