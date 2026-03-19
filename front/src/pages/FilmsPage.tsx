import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { CatalogToolbar } from "../components/media/CatalogToolbar";
import { MediaCard } from "../components/media/MediaCard";
import { UploadPopup } from "../components/upload/UploadPopup";
import {
  listCatalogGenres,
  listCatalogMedia,
  type CatalogGenre,
  type CatalogListResponse,
  type MediaCardItem,
} from "../lib/api";
import { useUpload } from "../upload/useUpload";

export function FilmsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { catalogVersion } = useUpload();
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const [showUpload, setShowUpload] = useState(false);
  const search = searchParams.get("q") ?? "";
  const genre = searchParams.get("genre") ?? "";
  const status = (searchParams.get("status") as "published" | "draft" | "all" | null) ?? (isAdmin ? "all" : "published");
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
        const payload = await listCatalogGenres("film", status);

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
  }, [status]);

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
          status,
          limit: 12,
        });

        if (!isMounted) {
          return;
        }

        setItems(payload.items);
        setPageInfo(payload.pageInfo);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load catalog");
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
  }, [catalogVersion, genre, search, status]);

  const handleSubmit = () => {
    const nextParams = new URLSearchParams();

    if (searchDraft.trim()) {
      nextParams.set("q", searchDraft.trim());
    }

    if (genre) {
      nextParams.set("genre", genre);
    }

    if (isAdmin && status !== "all") {
      nextParams.set("status", status);
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

    if (isAdmin && status !== "all") {
      nextParams.set("status", status);
    }

    setSearchParams(nextParams);
  };

  const handleStatusChange = (value: "published" | "draft" | "all") => {
    const nextParams = new URLSearchParams();

    if (search.trim()) {
      nextParams.set("q", search.trim());
    }

    if (genre) {
      nextParams.set("genre", genre);
    }

    if (isAdmin && value !== "all") {
      nextParams.set("status", value);
    }

    setSearchParams(nextParams);
  };

  const handleReset = () => {
    setSearchDraft("");
    const nextParams = new URLSearchParams();
    if (isAdmin && status !== "all") {
      nextParams.set("status", "all");
    }
    setSearchParams(nextParams);
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
        status,
        cursor: pageInfo.nextCursor,
        limit: pageInfo.limit,
      });

      setItems((current) => [...current, ...payload.items]);
      setPageInfo(payload.pageInfo);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load more films");
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
        activeStatus={status}
        showStatusFilter={isAdmin}
        onSearchChange={setSearchDraft}
        onGenreChange={handleGenreChange}
        onStatusChange={handleStatusChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Films</p>
            <h2>Catalogue complet</h2>
            <p className="muted">
              {search || genre || (isAdmin && status !== "all")
                ? `Filtres actifs : ${search ? `"${search}"` : "sans recherche"}${
                    genre ? `, genre "${genre}"` : ""
                  }${isAdmin ? `, statut "${status}"` : ""}.`
                : isAdmin
                  ? "Tous les films du catalogue sont listes ici, y compris les brouillons."
                  : "Tous les films publies sont listes ici par ordre d'ajout."}
            </p>
          </div>

          {isAdmin && (
            <div className="admin-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowUpload(true)}
              >
                Ajouter un film
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p className="muted">Chargement du catalogue...</p>
          </div>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="muted">
              {isAdmin && status === "draft"
                ? "Aucun brouillon ne correspond a ces filtres."
                : "Aucun film ne correspond a ces filtres."}
            </p>
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

      {showUpload && <UploadPopup onClose={() => setShowUpload(false)} />}
    </section>
  );
}
