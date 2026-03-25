import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MediaCard } from "../components/media/MediaCard";
import { listFavorites, type FavoriteItem } from "../lib/api";

type SortKey = "date" | "title-asc" | "title-desc" | "genre-asc";

function sortItems(items: FavoriteItem[], sort: SortKey): FavoriteItem[] {
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

export function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<SortKey>("date");

  useEffect(() => {
    listFavorites()
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
            <p className="eyebrow">Collection personnelle</p>
            <h2>Mes favoris</h2>
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
            <p className="muted">Tu n&apos;as pas encore de favoris.</p>
            <Link to="/films" className="primary-button">Parcourir le catalogue</Link>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            <details className="media-section-group" open>
              <summary>Films ({films.length})</summary>
              {films.length === 0 ? (
                <p className="muted">Aucun film en favoris.</p>
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
                        createdAt: item.favoritedAt,
                      }}
                    />
                  ))}
                </div>
              )}
            </details>

            <details className="media-section-group">
              <summary>Séries ({series.length})</summary>
              {series.length === 0 ? (
                <p className="muted">Aucune série en favoris.</p>
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
                        createdAt: item.favoritedAt,
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
