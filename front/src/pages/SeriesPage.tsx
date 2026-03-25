import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { CatalogToolbar } from "../components/media/CatalogToolbar";
import { MediaCard } from "../components/media/MediaCard";
import { SeriesCreatePopup } from "../components/upload/SeriesCreatePopup";
import {
  listCatalogGenres,
  listCatalogMedia,
  type CatalogGenre,
  type CatalogListResponse,
  type MediaCardItem,
} from "../lib/api";

export function SeriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const [showCreate, setShowCreate] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
    listCatalogGenres("series", status)
      .then((res) => { if (isMounted) setGenres(res.items); })
      .catch(() => { if (isMounted) setGenres([]); });
    return () => { isMounted = false; };
  }, [status]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");
    listCatalogMedia({ type: "series", search: search || undefined, genre: genre || undefined, status, limit: 12 })
      .then((res) => {
        if (!isMounted) return;
        setItems(res.items);
        setPageInfo(res.pageInfo);
      })
      .catch((e) => { if (isMounted) setError(e instanceof Error ? e.message : "Erreur de chargement"); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [genre, search, status, reloadKey]);

  const handleSubmit = () => {
    const p = new URLSearchParams();
    if (searchDraft.trim()) p.set("q", searchDraft.trim());
    if (genre) p.set("genre", genre);
    if (isAdmin && status !== "all") p.set("status", status);
    setSearchParams(p);
  };

  const handleGenreChange = (value: string) => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (value) p.set("genre", value);
    if (isAdmin && status !== "all") p.set("status", status);
    setSearchParams(p);
  };

  const handleStatusChange = (value: "published" | "draft" | "all") => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (genre) p.set("genre", genre);
    if (isAdmin && value !== "all") p.set("status", value);
    setSearchParams(p);
  };

  const handleReset = () => {
    setSearchDraft("");
    const p = new URLSearchParams();
    if (isAdmin) p.set("status", "all");
    setSearchParams(p);
  };

  const handleLoadMore = async () => {
    if (!pageInfo?.hasMore || !pageInfo.nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await listCatalogMedia({
        type: "series", search: search || undefined, genre: genre || undefined,
        status, cursor: pageInfo.nextCursor, limit: pageInfo.limit,
      });
      setItems((prev) => [...prev, ...res.items]);
      setPageInfo(res.pageInfo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
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
            <p className="eyebrow">Séries</p>
            <h2>Catalogue complet</h2>
            <p className="muted">
              {search || genre || (isAdmin && status !== "all")
                ? `Filtres actifs : ${search ? `"${search}"` : "sans recherche"}${genre ? `, genre "${genre}"` : ""}${isAdmin ? `, statut "${status}"` : ""}.`
                : isAdmin
                  ? "Toutes les séries du catalogue sont listées ici, y compris les brouillons."
                  : "Toutes les séries publiées sont listées ici par ordre d'ajout."}
            </p>
          </div>

          {isAdmin && (
            <div className="admin-actions">
              <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
                Ajouter une série
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p className="muted">Chargement du catalogue…</p>
          </div>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="muted">
              {isAdmin && status === "draft"
                ? "Aucun brouillon ne correspond à ces filtres."
                : "Aucune série ne correspond à ces filtres."}
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
                  {isLoadingMore ? "Chargement…" : "Charger plus"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <SeriesCreatePopup
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </section>
  );
}
