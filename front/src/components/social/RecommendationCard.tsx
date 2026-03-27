import { Link } from "react-router-dom";
import { getMediaPosterUrl } from "../../lib/api";
import type { RecommendationItem } from "../../lib/api";

type Props = {
  item: RecommendationItem;
};

export function RecommendationCard({ item }: Props) {
  const mediaPath = item.media.type === "film" ? `/films/${item.media.slug}` : `/series/${item.media.slug}`;
  const profilePath = `/users/${item.user.username}`;
  const synopsis = item.media.synopsis.length > 120
    ? item.media.synopsis.slice(0, 120) + "…"
    : item.media.synopsis;
  const comment = item.comment.length > 200
    ? item.comment.slice(0, 200) + "…"
    : item.comment;

  return (
    <article className="recommendation-card">
      <div className="recommendation-card-poster">
        {item.media.posterPath ? (
          <Link to={mediaPath}>
            <img
              src={getMediaPosterUrl(item.media.slug)}
              alt={`Affiche ${item.media.title}`}
              className="recommendation-poster-img"
            />
          </Link>
        ) : (
          <Link to={mediaPath} className="recommendation-poster-placeholder">
            <span>{item.media.type === "film" ? "Film" : "Série"}</span>
          </Link>
        )}
      </div>

      <div className="recommendation-card-body">
        <div className="recommendation-card-meta">
          <Link to={profilePath} className="recommendation-user">
            {item.user.avatarUrl ? (
              <img src={item.user.avatarUrl} alt={item.user.username} className="recommendation-avatar" />
            ) : (
              <span className="recommendation-avatar-placeholder">{item.user.username[0].toUpperCase()}</span>
            )}
            <span className="recommendation-username">{item.user.username}</span>
          </Link>
          <span className="status-label">{item.media.type === "film" ? "Film" : "Série"}</span>
        </div>

        <Link to={mediaPath} className="recommendation-title">
          {item.media.title}
        </Link>

        <p className="recommendation-synopsis muted">{synopsis}</p>

        <blockquote className="recommendation-comment">
          &ldquo;{comment}&rdquo;
        </blockquote>
      </div>
    </article>
  );
}
