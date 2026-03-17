import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CatalogToolbar } from "../components/media/CatalogToolbar";
import { MediaCard } from "../components/media/MediaCard";
import {
  listCatalogGenres,
  listCatalogMedia,
  type CatalogGenre,
  type CatalogListResponse,
  type MediaCardItem,
} from "../lib/api";

export function FilmsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const genre = searchParams.get("genre") ?? "";
  const [searchDraft, setSearchDraft] = useState(search);
  const [genres, setGenres] = useState<CatalogGenre[]>([]);
  const [items, setItems] = useState<MediaCardItem[]>([]);
  const [pageInfo, setPageInfo] = useState<CatalogListResponse["pageInfo"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    const loadGenres = async () => {
      try {
        const payload = await listCatalogGenres("film");

        if (isMounted) {
          setGenres(payload.items);
        }
      } catch {
        if (isMounted) {
          setGenres([]);
        }
      }
    };

    void loadGenres();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      setIsLoading(true);
      setError("");

      try {
        const payload = await listCatalogMedia({
          type: "film",
          search: search || undefined,
          genre: genre || undefined,
          limit: 12,
        });

        if (!isMounted) {
          return;
        }

        setItems(payload.items);
        setPageInfo(payload.pageInfo);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setError(error instanceof Error ? error.message : "Failed to load catalog");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [genre, search]);

  const handleSubmit = () => {
    const nextParams = new URLSearchParams();

    if (searchDraft.trim()) {
      nextParams.set("q", searchDraft.trim());
    }

    if (genre) {
      nextParams.set("genre", genre);
    }

    setSearchParams(nextParams);
  };

  const handleGenreChange = (value: string) => {
    const nextParams = new URLSearchParams();

    if (search.trim()) {
      nextParams.set("q", search.trim());
    }

    if (value) {
      nextParams.set("genre", value);
    }

    setSearchParams(nextParams);
  };

  const handleReset = () => {
    setSearchDraft("");
    setSearchParams(new URLSearchParams());
  };

  const handleLoadMore = async () => {
    if (!pageInfo?.hasMore || !pageInfo.nextCursor) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const payload = await listCatalogMedia({
        type: "film",
        search: search || undefined,
        genre: genre || undefined,
        cursor: pageInfo.nextCursor,
        limit: pageInfo.limit,
      });

      setItems((current) => [...current, ...payload.items]);
      setPageInfo(payload.pageInfo);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load more films");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <section className="page-section">
      <CatalogToolbar
        genres={genres}
        searchValue={searchDraft}
        activeGenre={genre}
        onSearchChange={setSearchDraft}
        onGenreChange={handleGenreChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Films</p>
            <h2>Catalogue complet</h2>
            <p className="muted">
              {search || genre
                ? `Filtres actifs: ${search ? `titre "${search}"` : "sans recherche"}${genre ? `, genre "${genre}"` : ""}.`
                : "Tous les films publies sont listes ici par ordre d'ajout."}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p className="muted">Chargement du catalogue...</p>
          </div>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="muted">Aucun film ne correspond a ces filtres.</p>
          </div>
        ) : (
          <>
            <div className="media-grid">
              {items.map((media) => (
                <MediaCard key={media.id} media={media} />
              ))}
            </div>

            {pageInfo?.hasMore && (
              <div className="catalog-pagination">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void handleLoadMore()}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Chargement..." : "Charger plus"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
