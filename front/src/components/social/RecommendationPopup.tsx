import { useEffect, useRef, useState } from "react";
import { getMyRecommendation, upsertRecommendation } from "../../lib/api";

type Props = {
  mediaId: string;
  mediaTitle: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function RecommendationPopup({ mediaId, mediaTitle, onClose, onSuccess }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [comment, setComment] = useState("");
  const [currentMediaTitle, setCurrentMediaTitle] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => { e.preventDefault(); onClose(); };
    dialog.addEventListener("cancel", handleCancel);
    dialog.showModal();
    document.body.style.overflow = "hidden";

    // Load current recommendation to check if it's for a different media
    getMyRecommendation().then((res) => {
      if (res.recommendation && res.recommendation.media.id !== mediaId) {
        setCurrentMediaTitle(res.recommendation.media.title);
      } else if (res.recommendation) {
        // Pre-fill comment if editing same media
        setComment(res.recommendation.comment);
      }
    }).catch(() => {});

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) dialog.close();
      document.body.style.overflow = "";
    };
  }, [onClose, mediaId]);

  const handleSubmit = async () => {
    if (!comment.trim()) { setError("Le commentaire est obligatoire."); return; }
    setError("");
    setIsSaving(true);
    try {
      await upsertRecommendation(mediaId, comment.trim());
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise en avant.");
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog ref={dialogRef} className="upload-dialog" onClick={handleBackdropClick}>
      <div className="upload-dialog-panel" style={{ maxWidth: 480 }}>
        <div className="upload-dialog-header">
          <div>
            <p className="eyebrow">Recommandation</p>
            <h2>Mettre en avant &ldquo;{mediaTitle}&rdquo;</h2>
          </div>
          <button type="button" className="upload-dialog-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className="upload-form">
          {currentMediaTitle && (
            <p className="form-warning" style={{ marginBottom: 12 }}>
              Ta recommandation actuelle (&ldquo;{currentMediaTitle}&rdquo;) sera remplacée.
            </p>
          )}

          {error && <p className="form-error" style={{ marginBottom: 10 }}>{error}</p>}

          <label className="upload-field">
            Commentaire <span className="required-mark">*</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Dis pourquoi tu recommandes ce média..."
            />
            <span className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
              {comment.length}/500 caractères
            </span>
          </label>

          <div className="upload-form-actions" style={{ marginTop: 20 }}>
            <button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
            <button
              type="button"
              className="primary-button"
              disabled={isSaving || !comment.trim()}
              onClick={() => void handleSubmit()}
            >
              {isSaving ? "Enregistrement..." : "Mettre en avant"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
