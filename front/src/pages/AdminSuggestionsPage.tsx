import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { UploadPopup } from "../components/upload/UploadPopup";
import {
  listAdminSuggestions,
  updateSuggestionStatus,
  type AdminSuggestionItem,
  type CreateMediaResult,
  type SuggestionStatus,
} from "../lib/api";

const AUTO_ACCEPT_NOTE =
  "Votre Suggestion a été acceptée, l'administrateur va la traiter le plus rapidement possible.";

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
  processed: "Traitée",
};

const STATUS_COLORS: Record<SuggestionStatus, string> = {
  pending: "#f59e0b",
  accepted: "#059669",
  refused: "#dc2626",
  processed: "#2563eb",
};

const FILTERS: { value: string; label: string; icon: string }[] = [
  { value: "", label: "Toutes", icon: "◈" },
  { value: "pending", label: "En attente", icon: "⏳" },
  { value: "accepted", label: "Acceptées", icon: "✓" },
  { value: "refused", label: "Refusées", icon: "✕" },
  { value: "processed", label: "Traitées", icon: "🎬" },
];

export function AdminSuggestionsPage() {
  const { user } = useSession();
  const [items, setItems] = useState<AdminSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Refusal modal state
  const [refuseTarget, setRefuseTarget] = useState<AdminSuggestionItem | null>(null);
  const [refuseReason, setRefuseReason] = useState("");
  const [refuseError, setRefuseError] = useState("");

  // Process-via-upload state
  const [processTarget, setProcessTarget] = useState<AdminSuggestionItem | null>(null);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const load = (status?: string) => {
    setIsLoading(true); setError("");
    listAdminSuggestions(status || undefined)
      .then((res) => { setItems(res.items); })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(filter); }, [filter]);

  const handleAccept = async (item: AdminSuggestionItem) => {
    setUpdating(item.id);
    try {
      await updateSuggestionStatus(item.id, "accepted", AUTO_ACCEPT_NOTE);
      load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUpdating(null);
    }
  };

  const openRefuseModal = (item: AdminSuggestionItem) => {
    setRefuseTarget(item);
    setRefuseReason("");
    setRefuseError("");
  };

  const confirmRefuse = async () => {
    if (!refuseTarget) return;
    const reason = refuseReason.trim();
    if (!reason) { setRefuseError("Le motif de refus est obligatoire."); return; }
    setUpdating(refuseTarget.id);
    const adminNote = `Votre suggestion a été refusée pour la raison suivante: ${reason}`;
    try {
      await updateSuggestionStatus(refuseTarget.id, "refused", adminNote);
      setRefuseTarget(null);
      load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUpdating(null);
    }
  };

  const handleUploaded = async (result: CreateMediaResult) => {
    if (!processTarget) return;
    const processNote = `Votre demande a été traitée, vous pouvez retrouver ${result.media.title} dans votre catalogue.`;
    try {
      await updateSuggestionStatus(processTarget.id, "processed", processNote, result.media.id);
      setProcessTarget(null);
      load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du marquage.");
    }
  };

  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    total: items.length,
  };

  return (
    <section className="page-section">
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h2>Suggestions reçues</h2>
            <p className="muted">
              {counts.pending > 0
                ? `${counts.pending} suggestion${counts.pending > 1 ? "s" : ""} en attente`
                : "Aucune suggestion en attente"}
              {counts.total > 0 && ` · ${counts.total} au total`}
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="admin-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`admin-filter-btn${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}
        {isLoading && <p className="muted">Chargement…</p>}

        {!isLoading && items.length === 0 && (
          <div className="empty-state">
            <p className="muted">Aucune suggestion trouvée pour ce filtre.</p>
          </div>
        )}

        <div className="sug-admin-list">
          {items.map((item) => {
            const isProcessed = item.status === "processed";
            const color = STATUS_COLORS[item.status];
            return (
              <div key={item.id} className="sug-admin-card">
                {/* En-tête */}
                <div className="sug-admin-card-header">
                  <div className="sug-admin-user">
                    <div className="rating-avatar" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                      {item.user.avatarUrl
                        ? <img src={item.user.avatarUrl} alt={item.user.username} />
                        : <span>{item.user.username.charAt(0).toUpperCase()}</span>}
                    </div>
                    <Link to={`/users/${item.user.username}`} className="sug-admin-username">
                      {item.user.username}
                    </Link>
                    <span className="muted" style={{ fontSize: "0.78rem" }}>
                      · {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <span
                    className="sug-status-badge"
                    style={{ background: `${color}20`, color, borderColor: `${color}40` }}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>

                {/* Contenu */}
                <div className="sug-admin-card-body">
                  <strong className="sug-card-title">{item.title}</strong>
                  {item.synopsis && <p className="muted sug-card-synopsis">{item.synopsis}</p>}
                  {item.media && (
                    <p style={{ fontSize: "0.82rem", marginTop: 4 }}>
                      Lié à : <Link to={`/films/${item.media.slug}`}>{item.media.title}</Link>
                    </p>
                  )}
                  {item.adminNote && (
                    <div className="sug-admin-note-display">
                      <span className="eyebrow" style={{ fontSize: "0.7rem" }}>Message envoyé à l'utilisateur</span>
                      <p>{item.adminNote}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isProcessed && (
                  <div className="sug-admin-actions">
                    {item.status !== "accepted" && (
                      <button
                        type="button"
                        className="sug-action-btn is-accept"
                        onClick={() => void handleAccept(item)}
                        disabled={updating === item.id}
                      >
                        ✓ Accepter
                      </button>
                    )}
                    {item.status !== "refused" && (
                      <button
                        type="button"
                        className="sug-action-btn is-refuse"
                        onClick={() => openRefuseModal(item)}
                        disabled={updating === item.id}
                      >
                        ✕ Refuser
                      </button>
                    )}
                    <button
                      type="button"
                      className="sug-action-btn is-process"
                      onClick={() => setProcessTarget(item)}
                      disabled={updating === item.id}
                    >
                      🎬 Marquer traitée
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal refus */}
      {refuseTarget && (
        <div className="modal-overlay" onClick={() => setRefuseTarget(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Refuser la suggestion</h3>
              <button type="button" className="modal-close" onClick={() => setRefuseTarget(null)}>✕</button>
            </div>
            <p className="muted" style={{ marginBottom: 12 }}>
              Suggestion : <strong>{refuseTarget.title}</strong>
            </p>
            <div className="form-field">
              <label htmlFor="refuse-reason">
                Motif de refus <span className="required">*</span>
              </label>
              <textarea
                id="refuse-reason"
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder="Expliquez pourquoi cette suggestion est refusée…"
                autoFocus
              />
            </div>
            {refuseError && <p className="form-error">{refuseError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setRefuseTarget(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => void confirmRefuse()}
                disabled={updating === refuseTarget.id}
              >
                {updating === refuseTarget.id ? "…" : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload popup pour "Marquer traitée" */}
      {processTarget && (
        <UploadPopup
          onClose={() => setProcessTarget(null)}
          onUploaded={(result) => void handleUploaded(result)}
        />
      )}
    </section>
  );
}
