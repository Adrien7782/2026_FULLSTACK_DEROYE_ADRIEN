import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MediaCard } from "../components/media/MediaCard";
import { listWatchlist, type WatchlistEntry } from "../lib/api";

type SortKey = "date" | "title-asc" | "title-desc" | "genre-asc";

function sortItems(items: WatchlistEntry[], sort: SortKey): WatchlistEntry[] {
  const sorted = [...items];
  if (sort === "title-asc") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "title-desc") {
    sorted.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sort === "genre-asc") {
    sorted.sort((a, b) => {
      const ga = a.genres[0]?.name ?? "";
      const gb = b.genres[0]?.name ?? "";
      return ga.localeCompare(gb);
    });
  }
  // "date" keeps insertion order (already ordered by date desc from API)
  return sorted;
}

export function WatchlistPage() {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<SortKey>("date");

  useEffect(() => {
    listWatchlist()
      .then((res) => setItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  }, []);

  const films = sortItems(
    items.filter((i) => i.type === "film"),
    sort,
  );
  const series = sortItems(
    items.filter((i) => i.type === "series"),
    sort,
  );

  const isEmpty = !isLoading && !error && items.length === 0;

  return (
    <section className="page-section">
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">À regarder</p>
            <h2>Ma liste</h2>
          </div>
          {items.length > 0 && (
            <div className="sort-toolbar">
              <label>
                Trier par&nbsp;
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  <option value="date">Date d&apos;ajout</option>
                  <option value="title-asc">Titre A→Z</option>
                  <option value="title-desc">Titre Z→A</option>
                  <option value="genre-asc">Genre A→Z</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {isLoading && <p className="muted">Chargement…</p>}
        {error && <p className="form-error">{error}</p>}

        {isEmpty && (
          <div className="empty-state">
            <p className="muted">Ta liste est vide pour l&apos;instant.</p>
            <Link to="/films" className="primary-button">Parcourir le catalogue</Link>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            <details className="media-section-group" open>
              <summary>Films ({films.length})</summary>
              {films.length === 0 ? (
                <p className="muted">Aucun film dans ta liste.</p>
              ) : (
                <div className="media-grid">
                  {films.map((item) => (
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
                        genres: item.genres,
                        catalogIndex: 0,
                        createdAt: item.addedAt,
                      }}
                    />
                  ))}
                </div>
              )}
            </details>

            <details className="media-section-group">
              <summary>Séries ({series.length})</summary>
              {series.length === 0 ? (
                <p className="muted">Aucune série dans ta liste.</p>
              ) : (
                <div className="media-grid">
                  {series.map((item) => (
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
                        genres: item.genres,
                        catalogIndex: 0,
                        createdAt: item.addedAt,
                      }}
                    />
                  ))}
                </div>
              )}
            </details>
          </>
        )}
      </div>
    </section>
  );
}
