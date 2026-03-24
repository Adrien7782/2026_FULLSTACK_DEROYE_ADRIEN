import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelSuggestion,
  createSuggestion,
  listMySuggestions,
  type SuggestionItem,
  type SuggestionStatus,
} from "../lib/api";

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

const STATUS_ICON: Record<SuggestionStatus, string> = {
  pending: "⏳",
  accepted: "✓",
  refused: "✕",
  processed: "🎬",
};

export function SuggestionsPage() {
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  const load = () => {
    setIsLoading(true);
    listMySuggestions()
      .then((res) => setItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); setSuccess("");
    if (!title.trim()) { setFormError("Le titre est obligatoire."); return; }
    setIsSubmitting(true);
    try {
      await createSuggestion(title.trim(), synopsis.trim() || undefined);
      setTitle(""); setSynopsis("");
      setSuccess("Suggestion envoyée avec succès !");
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erreur lors de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Annuler cette suggestion ?")) return;
    setCancelling(id);
    try {
      await cancelSuggestion(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCancelling(null);
    }
  };

  const pending = items.filter((i) => i.status === "pending");
  const others = items.filter((i) => i.status !== "pending");

  return (
    <section className="page-section">
      {/* Formulaire */}
      <div className="panel sug-form-panel">
        <div className="sug-form-intro">
          <div className="sug-form-icon">🎬</div>
          <div>
            <p className="eyebrow">Catalogue</p>
            <h2>Suggérer un film</h2>
            <p className="muted">
              Tu ne trouves pas un film dans le catalogue ?<br />
              Propose-le ici — un administrateur examinera ta demande.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="sug-form">
          <div className="form-field">
            <label htmlFor="sug-title">
              Titre du film <span className="required">*</span>
            </label>
            <input
              id="sug-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>
          <div className="form-field">
            <label htmlFor="sug-synopsis">
              Pourquoi ce film ? <span className="optional">(optionnel)</span>
            </label>
            <textarea
              id="sug-synopsis"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Résumé, réalisateur, raisons de l'ajouter…"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          {formError && <p className="form-error">{formError}</p>}
          {success && <p className="form-success">{success}</p>}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours…" : "Envoyer la suggestion"}
          </button>
        </form>
      </div>

      {/* Mes suggestions */}
      <div className="panel">
        <p className="eyebrow">Mes suggestions</p>
        <h2>Suivi de mes demandes</h2>

        {isLoading && <p className="muted">Chargement…</p>}
        {error && <p className="form-error">{error}</p>}

        {!isLoading && items.length === 0 && (
          <div className="empty-state">
            <p className="muted">Tu n&apos;as encore envoyé aucune suggestion.</p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="sug-section">
            <p className="sug-section-label">En attente de traitement</p>
            <div className="sug-list">
              {pending.map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  onCancel={() => void handleCancel(item.id)}
                  isCancelling={cancelling === item.id}
                  statusLabel={STATUS_LABELS[item.status]}
                  statusColor={STATUS_COLORS[item.status]}
                  statusIcon={STATUS_ICON[item.status]}
                />
              ))}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="sug-section">
            <p className="sug-section-label">Traitées</p>
            <div className="sug-list">
              {others.map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  statusLabel={STATUS_LABELS[item.status]}
                  statusColor={STATUS_COLORS[item.status]}
                  statusIcon={STATUS_ICON[item.status]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SuggestionCard({
  item,
  onCancel,
  isCancelling,
  statusLabel,
  statusColor,
  statusIcon,
}: {
  item: SuggestionItem;
  onCancel?: () => void;
  isCancelling?: boolean;
  statusLabel: string;
  statusColor: string;
  statusIcon: string;
}) {
  return (
    <div className="sug-card">
      <div className="sug-card-top">
        <div className="sug-card-title-row">
          <strong className="sug-card-title">{item.title}</strong>
          <span
            className="sug-status-badge"
            style={{ background: `${statusColor}20`, color: statusColor, borderColor: `${statusColor}40` }}
          >
            {statusIcon} {statusLabel}
          </span>
        </div>
        {item.synopsis && <p className="sug-card-synopsis muted">{item.synopsis}</p>}
      </div>

      {item.adminNote && (
        <div className="sug-card-admin-note">
          <span className="eyebrow" style={{ fontSize: "0.7rem" }}>Message de l&apos;administrateur</span>
          <p>{item.adminNote}</p>
        </div>
      )}

      {item.media && (
        <div className="sug-card-media">
          <span className="eyebrow" style={{ fontSize: "0.7rem" }}>Film ajouté</span>
          <Link to={`/films/${item.media.slug}`} className="sug-media-link">
            🎬 {item.media.title}
          </Link>
        </div>
      )}

      <div className="sug-card-footer">
        <span className="muted" style={{ fontSize: "0.78rem" }}>
          {new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </span>
        {item.status === "pending" && onCancel && (
          <button
            type="button"
            className="sug-cancel-btn"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? "Annulation…" : "Annuler"}
          </button>
        )}
      </div>
    </div>
  );
}
