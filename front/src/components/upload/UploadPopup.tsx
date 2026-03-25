import { useEffect, useRef, useState } from "react";
import {
  importFilmFromDir,
  listCatalogGenres,
  scanFilmPath,
  getAdminPreviewAssetUrl,
  type CatalogGenre,
  type FilmDirectoryScan,
  type CreateMediaResult,
} from "../../lib/api";
import { useUpload } from "../../upload/useUpload";

type UploadPopupProps = {
  onClose: () => void;
  onUploaded?: (result: CreateMediaResult) => void;
};

export function UploadPopup({ onClose, onUploaded }: UploadPopupProps) {
  const { bumpCatalogVersion } = useUpload();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // ── Metadata ───────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [genres, setGenres] = useState<CatalogGenre[]>([]);

  // ── Directory scan ─────────────────────────────────────────────────────────
  const [dirPath, setDirPath] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FilmDirectoryScan | null>(null);
  const [scanError, setScanError] = useState("");

  // ── Submit ─────────────────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => { event.preventDefault(); onClose(); };
    dialog.addEventListener("cancel", handleCancel);
    dialog.showModal();
    document.body.style.overflow = "hidden";
    listCatalogGenres("film").then((res) => setGenres(res.items)).catch(() => {});
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) dialog.close();
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const handleScan = async () => {
    const path = dirPath.trim();
    if (!path) return;
    setScanError("");
    setScanResult(null);
    setIsScanning(true);
    try {
      const res = await scanFilmPath(path);
      setScanResult(res.scan);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Scan impossible.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) { setError("Le titre est obligatoire."); return; }
    if (!synopsis.trim()) { setError("Le synopsis est obligatoire."); return; }
    if (!dirPath.trim()) { setError("Le chemin du répertoire est obligatoire."); return; }
    if (!scanResult) { setError("Scannez d'abord le répertoire."); return; }
    if (!scanResult.videoRelativePath) { setError("Aucun fichier VIDEO trouvé dans ce répertoire."); return; }

    setIsSubmitting(true);
    try {
      const result = await importFilmFromDir({
        dirPath: dirPath.trim(),
        title: title.trim(),
        synopsis: synopsis.trim(),
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        status,
        genreIds: selectedGenreIds.length > 0 ? selectedGenreIds : undefined,
      });
      bumpCatalogVersion();
      onUploaded?.({ media: result.media });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Création du média impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog ref={dialogRef} className="upload-dialog" onClick={handleBackdropClick}>
      <div className="upload-dialog-panel">
        <div className="upload-dialog-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h2>Ajouter un film</h2>
          </div>
          <button type="button" className="upload-dialog-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="upload-form">
          {error && <p className="form-error">{error}</p>}

          {/* ── Métadonnées ── */}
          <div className="form-grid">
            <label className="upload-field full-width">
              Titre <span className="required-mark">*</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Blade Runner 2049"
                maxLength={200}
              />
            </label>

            <label className="upload-field full-width">
              Synopsis <span className="required-mark">*</span>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Description du film..."
                maxLength={2000}
                rows={3}
              />
            </label>

            <label className="upload-field">
              Année de sortie
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                min={1888}
                max={2100}
                placeholder="2024"
              />
            </label>

            <label className="upload-field">
              Statut
              <select value={status} onChange={(e) => setStatus(e.target.value as "published" | "draft")}>
                <option value="published">Public</option>
                <option value="draft">Brouillon</option>
              </select>
            </label>
          </div>

          {genres.length > 0 && (
            <div className="upload-field">
              <span className="upload-field-label">Genres</span>
              <div className="chip-row upload-genre-row">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    className={`genre-chip upload-genre-chip${selectedGenreIds.includes(genre.id) ? " is-selected" : ""}`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid var(--border-color, #333)" }} />

          {/* ── Répertoire du film ── */}
          <p className="upload-field-label" style={{ marginBottom: 10 }}>Répertoire du film</p>
          <p className="muted" style={{ marginBottom: 12, fontSize: "0.85rem" }}>
            Le répertoire doit contenir un fichier <code>VIDEO.*</code> (mp4, webm…) et optionnellement <code>POSTER.*</code> (jpg, png…).
          </p>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
            <label className="upload-field" style={{ flex: 1, marginBottom: 0 }}>
              Chemin du répertoire <span className="required-mark">*</span>
              <input
                type="text"
                value={dirPath}
                onChange={(e) => { setDirPath(e.target.value); setScanResult(null); setScanError(""); }}
                placeholder="Ex: FILMS/blade-runner-2049"
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              style={{ alignSelf: "flex-end" }}
              onClick={() => void handleScan()}
              disabled={!dirPath.trim() || isScanning}
            >
              {isScanning ? "Scan..." : "Scanner"}
            </button>
          </div>

          {scanError && <p className="form-error" style={{ marginTop: 6 }}>{scanError}</p>}

          {scanResult && (
            <div className="scan-preview-block" style={{ marginTop: 10, marginBottom: 14 }}>
              {scanResult.videoRelativePath ? (
                <p className="scan-preview-ok">✅ VIDEO détectée : {scanResult.videoRelativePath}</p>
              ) : (
                <p className="form-error">❌ Aucun fichier VIDEO trouvé (attendu : VIDEO.mp4 ou similaire)</p>
              )}
              {scanResult.posterRelativePath ? (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <p className="scan-preview-ok">✅ Affiche trouvée</p>
                  <img
                    src={getAdminPreviewAssetUrl(scanResult.posterRelativePath)}
                    alt="Aperçu affiche"
                    className="scan-poster-preview"
                  />
                </div>
              ) : (
                <p className="muted" style={{ marginTop: 6, fontSize: "0.85rem" }}>Aucune affiche détectée (optionnel).</p>
              )}
            </div>
          )}

          <p className="upload-limit-note muted">
            La durée est détectée automatiquement depuis le fichier vidéo.
          </p>

          <div className="upload-form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
            <button
              type="button"
              className="primary-button"
              disabled={isSubmitting || !scanResult?.videoRelativePath}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? "Création..." : "Ajouter au catalogue"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
