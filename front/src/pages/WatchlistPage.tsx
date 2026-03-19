import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MediaCard } from "../components/media/MediaCard";
import { listWatchlist, type WatchlistEntry } from "../lib/api";

export function WatchlistPage() {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listWatchlist()
      .then((res) => setItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="page-section">
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">À regarder</p>
            <h2>Ma liste</h2>
          </div>
        </div>

        {isLoading && <p className="muted">Chargement…</p>}
        {error && <p className="form-error">{error}</p>}

        {!isLoading && !error && items.length === 0 && (
          <div className="empty-state">
            <p className="muted">Ta liste est vide pour l&apos;instant.</p>
            <Link to="/films" className="primary-button">Parcourir le catalogue</Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="media-grid">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                media={{
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  synopsis: "",
                  type: item.type,
                  releaseYear: item.releaseYear,
                  durationMinutes: item.durationMinutes,
                  hasPoster: !!item.posterPath,
                  hasVideo: false,
                  hasBackdrop: false,
                  status: item.status as "published" | "draft" | "archived",
                  genres: [],
                  catalogIndex: 0,
                  createdAt: item.addedAt,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
