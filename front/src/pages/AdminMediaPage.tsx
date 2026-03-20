import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { GlobalUploadIndicator } from "../components/upload/GlobalUploadIndicator";
import { UploadPopup } from "../components/upload/UploadPopup";
import {
  deleteMediaBySlug,
  getMediaPosterUrl,
  listAdminMedia,
  type AdminMediaItem,
} from "../lib/api";
import { useUpload } from "../upload/useUpload";

const STATUS_COLORS: Record<string, string> = {
  published: "#059669",
  draft: "#6b7280",
  archived: "#2563eb",
};

const STATUS_LABELS: Record<string, string> = {
  published: "Publié",
  draft: "Brouillon",
  archived: "Archivé",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "published", label: "Publiés" },
  { value: "draft", label: "Brouillons" },
  { value: "archived", label: "Archivés" },
];

function MediaPoster({ item }: { item: AdminMediaItem }) {
  const [failed, setFailed] = useState(false);
  const initials = item.title.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "").join("");
  if (!item.hasPoster || failed) {
    return (
      <div className="admin-media-poster is-fallback">
        <span>{initials}</span>
      </div>
    );
  }
  return (
    <img
      className="admin-media-poster"
      src={getMediaPosterUrl(item.slug)}
      alt={item.title}
      onError={() => setFailed(true)}
    />
  );
}

export function AdminMediaPage() {
  const { user } = useSession();
  const { catalogVersion } = useUpload();

  const [allItems, setAllItems] = useState<AdminMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const load = (status?: string) => {
    setIsLoading(true); setError("");
    listAdminMedia(status || undefined)
      .then((res) => setAllItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(filter); }, [filter, catalogVersion]);

  const handleDelete = async (item: AdminMediaItem) => {
    if (!window.confirm(`Supprimer "${item.title}" ? Cette action est irréversible.`)) return;
    setDeleting(item.slug);
    try {
      await deleteMediaBySlug(item.slug);
      load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression.");
    } finally {
      setDeleting(null);
    }
  };

  const items = search.trim()
    ? allItems.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  return (
    <section className="page-section">
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h2>Gestion des médias</h2>
            <p className="muted">{allItems.length} média{allItems.length !== 1 ? "s" : ""} au total</p>
          </div>
          <button type="button" className="primary-button" onClick={() => setIsPopupOpen(true)}>
            + Ajouter un film
          </button>
        </div>

        {/* Filtres + recherche */}
        <div className="admin-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`admin-filter-btn${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
          <div className="admin-search-wrap">
            <input
              type="search"
              className="admin-search-input"
              placeholder="Rechercher un titre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {isLoading && <p className="muted">Chargement…</p>}

        {!isLoading && items.length === 0 && (
          <div className="empty-state">
            <p className="muted">
              {search ? `Aucun résultat pour "${search}".` : "Aucun média trouvé."}
            </p>
          </div>
        )}

        <div className="admin-media-list">
          {items.map((item) => {
            const color = STATUS_COLORS[item.status] ?? "#6b7280";
            return (
              <div key={item.id} className="admin-media-row">
                <MediaPoster item={item} />
                <div className="admin-media-info">
                  <Link to={`/films/${item.slug}`} className="admin-media-title">
                    {item.title}
                  </Link>
                  <div className="admin-media-meta">
                    {item.releaseYear && <span>{item.releaseYear}</span>}
                    {item.durationMinutes && <span>{item.durationMinutes} min</span>}
                    <span>♥ {item._count.favorites}</span>
                    <span>★ {item._count.ratings}</span>
                  </div>
                </div>
                <span
                  className="sug-status-badge"
                  style={{ background: `${color}20`, color, borderColor: `${color}40` }}
                >
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => void handleDelete(item)}
                  disabled={deleting === item.slug}
                >
                  {deleting === item.slug ? "…" : "Supprimer"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {isPopupOpen && <UploadPopup onClose={() => setIsPopupOpen(false)} />}
      <GlobalUploadIndicator />
    </section>
  );
}
