import { useEffect, useRef, useState } from "react";
import {
  getAdminFilmDirPath,
  getAdminPreviewAssetUrl,
  listCatalogGenres,
  scanFilmPath,
  updateFilmMeta,
  type CatalogGenre,
  type FilmDirectoryScan,
  type MediaGenre,
  type MediaStatus,
} from "../../lib/api";

type Props = {
  slug: string;
  title: string;
  synopsis: string;
  releaseYear: number | null;
  status: MediaStatus;
  genres: MediaGenre[];
  onClose: () => void;
  onUpdated: () => void;
};

export function FilmEditPopup({
  slug,
  title: initialTitle,
  synopsis: initialSynopsis,
  releaseYear: initialReleaseYear,
  status: initialStatus,
  genres: initialGenres,
  onClose,
  onUpdated,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // ── Part 1: Metadata ───────────────────────────────────────────────────────
  const [title, setTitle] = useState(initialTitle);
  const [synopsis, setSynopsis] = useState(initialSynopsis);
  const [releaseYear, setReleaseYear] = useState(initialReleaseYear?.toString() ?? "");
  const [status, setStatus] = useState<"published" | "draft" | "archived">(initialStatus);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(initialGenres.map((g) => g.id));
  const [allGenres, setAllGenres] = useState<CatalogGenre[]>([]);

  // ── Part 2: Directory ──────────────────────────────────────────────────────
  const [currentDirPath, setCurrentDirPath] = useState<string | null>(null);
  const [newDirPath, setNewDirPath] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FilmDirectoryScan | null>(null);
  const [scanError, setScanError] = useState("");

  // ── Save ───────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => { event.preventDefault(); onClose(); };
    dialog.addEventListener("cancel", handleCancel);
    dialog.showModal();
    document.body.style.overflow = "hidden";
    listCatalogGenres("film").then((res) => setAllGenres(res.items)).catch(() => {});
    getAdminFilmDirPath(slug).then((res) => setCurrentDirPath(res.filmDirPath)).catch(() => {});
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) dialog.close();
      document.body.style.overflow = "";
    };
  }, [onClose, slug]);

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const handleScan = async () => {
    const path = newDirPath.trim();
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

  const handleSave = async () => {
    setSaveError("");
    if (!title.trim()) { setSaveError("Le titre est obligatoire."); return; }
    if (!synopsis.trim()) { setSaveError("Le synopsis est obligatoire."); return; }

    const trimmedNewDir = newDirPath.trim();
    if (trimmedNewDir && (!scanResult || !scanResult.videoRelativePath)) {
      setSaveError("Scannez le répertoire avant de sauvegarder, ou laissez le champ vide pour ne pas modifier les fichiers.");
      return;
    }

    setIsSaving(true);
    try {
      await updateFilmMeta(slug, {
        title: title.trim(),
        synopsis: synopsis.trim(),
        releaseYear: releaseYear ? Number(releaseYear) : null,
        status,
        genreIds: selectedGenreIds,
        dirPath: trimmedNewDir || undefined,
      });
      onUpdated();
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Sauvegarde impossible.");
      setIsSaving(false);
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
            <h2>Modifier — {initialTitle}</h2>
          </div>
          <button type="button" className="upload-dialog-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="upload-form">
          {/* ── Part 1: Metadata ── */}
          <section className="series-edit-section">
            <p className="upload-field-label" style={{ marginBottom: 14 }}>Métadonnées</p>

            {saveError && <p className="form-error" style={{ marginBottom: 10 }}>{saveError}</p>}

            <div className="form-grid">
              <label className="upload-field full-width">
                Titre <span className="required-mark">*</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); }}
                  maxLength={200}
                />
              </label>

              <label className="upload-field full-width">
                Synopsis <span className="required-mark">*</span>
                <textarea
                  value={synopsis}
                  onChange={(e) => { setSynopsis(e.target.value); }}
                  maxLength={2000}
                  rows={3}
                />
              </label>

              <label className="upload-field">
                Année de sortie
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => { setReleaseYear(e.target.value); }}
                  min={1888}
                  max={2100}
                  placeholder="2024"
                />
              </label>

              <label className="upload-field">
                Statut
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value as "published" | "draft" | "archived"); }}
                >
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                  <option value="archived">Archivé</option>
                </select>
              </label>
            </div>

            {allGenres.length > 0 && (
              <div className="upload-field">
                <span className="upload-field-label">Genres</span>
                <div className="chip-row upload-genre-row">
                  {allGenres.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      className={`genre-chip upload-genre-chip${selectedGenreIds.includes(genre.id) ? " is-selected" : ""}`}
                      onClick={() => { toggleGenre(genre.id); }}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid var(--border-color, #333)" }} />

          {/* ── Part 2: Directory ── */}
          <section className="series-edit-section">
            <p className="upload-field-label" style={{ marginBottom: 14 }}>Répertoire du film</p>

            {currentDirPath && (
              <p className="muted" style={{ marginBottom: 12, fontSize: "0.85rem", wordBreak: "break-all" }}>
                Répertoire actuel : <code>{currentDirPath}</code>
              </p>
            )}

            <p className="muted" style={{ marginBottom: 10, fontSize: "0.85rem" }}>
              Pour modifier les fichiers, indique un nouveau répertoire contenant <code>VIDEO.*</code> et optionnellement <code>POSTER.*</code>.
              Laisse vide pour conserver les fichiers actuels.
            </p>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <label className="upload-field" style={{ flex: 1, marginBottom: 0 }}>
                Nouveau répertoire
                <input
                  type="text"
                  value={newDirPath}
                  onChange={(e) => { setNewDirPath(e.target.value); setScanResult(null); setScanError(""); }}
                  placeholder="Ex: FILMS/nouveau-dossier"
                />
              </label>
              <button
                type="button"
                className="secondary-button"
                style={{ alignSelf: "flex-end" }}
                onClick={() => void handleScan()}
                disabled={!newDirPath.trim() || isScanning}
              >
                {isScanning ? "Scan..." : "Scanner"}
              </button>
            </div>

            {scanError && <p className="form-error" style={{ marginTop: 6 }}>{scanError}</p>}

            {scanResult && (
              <div className="scan-preview-block" style={{ marginTop: 10 }}>
                {scanResult.videoRelativePath ? (
                  <p className="scan-preview-ok">✅ VIDEO détectée : {scanResult.videoRelativePath}</p>
                ) : (
                  <p className="form-error">❌ Aucun fichier VIDEO trouvé</p>
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
                  <p className="muted" style={{ marginTop: 6, fontSize: "0.85rem" }}>Aucune affiche détectée.</p>
                )}
              </div>
            )}
          </section>

          {/* ── Bottom actions ── */}
          <div className="upload-form-actions" style={{ marginTop: 24 }}>
            <button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
            <button
              type="button"
              className="primary-button"
              disabled={isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
