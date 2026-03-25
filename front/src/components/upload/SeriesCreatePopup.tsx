import React, { useEffect, useRef, useState } from "react";
import {
  getAdminPreviewAssetUrl,
  importSeriesFromDir,
  listCatalogGenres,
  scanSeriesPath,
  type CatalogGenre,
  type SeriesDirectoryScan,
} from "../../lib/api";
import { useUpload } from "../../upload/useUpload";

type Props = {
  onClose: () => void;
  onCreated?: (slug: string) => void;
};

export function SeriesCreatePopup({ onClose, onCreated }: Props) {
  const { bumpCatalogVersion } = useUpload();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Step 1: directory path + scan
  const [dirPath, setDirPath] = useState("");
  const [scan, setScan] = useState<SeriesDirectoryScan | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  // Step 2: metadata
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [genres, setGenres] = useState<CatalogGenre[]>([]);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => { event.preventDefault(); onClose(); };
    dialog.addEventListener("cancel", handleCancel);
    dialog.showModal();
    document.body.style.overflow = "hidden";
    listCatalogGenres("series").then((res) => setGenres(res.items)).catch(() => {});
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) dialog.close();
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleScan = async () => {
    setScanError("");
    setScan(null);
    if (!dirPath.trim()) { setScanError("Renseigne un chemin de répertoire."); return; }
    setIsScanning(true);
    try {
      const result = await scanSeriesPath(dirPath.trim());
      setScan(result.scan);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Scan impossible.");
    } finally {
      setIsScanning(false);
    }
  };

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const totalEpisodes = scan?.seasons.reduce((acc, s) => acc + s.episodes.length, 0) ?? 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!scan) { setError("Lance le scan du répertoire avant de créer la série."); return; }
    if (!title.trim()) { setError("Le titre est obligatoire."); return; }
    if (!synopsis.trim()) { setError("Le synopsis est obligatoire."); return; }

    setIsSubmitting(true);
    try {
      const result = await importSeriesFromDir({
        dirPath: dirPath.trim(),
        title: title.trim(),
        synopsis: synopsis.trim(),
        status,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        genreIds: selectedGenreIds.length > 0 ? selectedGenreIds : undefined,
      });
      bumpCatalogVersion();
      onCreated?.(result.serie.slug);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Création impossible.");
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
            <h2>Ajouter une série</h2>
          </div>
          <button type="button" className="upload-dialog-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="upload-form">
          {error && <p className="form-error">{error}</p>}

          {/* Metadata */}
          <div className="form-grid">
            <label className="upload-field full-width">
              Titre <span className="required-mark">*</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Breaking Bad"
                maxLength={200}
                required
              />
            </label>

            <label className="upload-field full-width">
              Synopsis <span className="required-mark">*</span>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Description de la série…"
                maxLength={2000}
                rows={3}
                required
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
                <option value="published">Publié</option>
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

          {/* Scan directory */}
          <div className="upload-field full-width">
            <span className="upload-field-label">
              Chemin du répertoire <span className="required-mark">*</span>
            </span>
            <p className="upload-field-hint">
              Structure attendue : <code>SERIES/ma-serie/S1_titre/EP1_titre.mp4</code>
              — l&apos;affiche doit s&apos;appeler <code>POSTER.jpg</code> (ou .png, .webp…)
            </p>
            <div className="scan-path-row">
              <input
                type="text"
                value={dirPath}
                onChange={(e) => { setDirPath(e.target.value); setScan(null); setScanError(""); }}
                placeholder="/app/data/SERIES/breaking-bad"
              />
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleScan()}
                disabled={isScanning || !dirPath.trim()}
              >
                {isScanning ? "Scan…" : "Scanner"}
              </button>
            </div>
            {scanError && <p className="form-error" style={{ marginTop: 6 }}>{scanError}</p>}
          </div>

          {/* Scan preview */}
          {scan && (
            <div className="scan-preview">
              {scan.posterRelativePath && (
                <img
                  src={getAdminPreviewAssetUrl(scan.posterRelativePath)}
                  alt="Aperçu affiche"
                  className="scan-poster-preview"
                />
              )}
              <p className="scan-preview-ok">
                ✅ {scan.seasons.length} saison(s) • {totalEpisodes} épisode(s)
                {scan.posterRelativePath ? " • affiche détectée" : " • aucune affiche détectée"}
              </p>
              {scan.seasons.map((s) => (
                <details key={s.number} className="scan-season-detail">
                  <summary>Saison {s.number}{s.title ? ` — ${s.title}` : ""} ({s.episodes.length} épisode(s))</summary>
                  <ul>
                    {s.episodes.map((e) => (
                      <li key={e.number}>Ep.{e.number} — {e.title}</li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}

          <div className="upload-form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
            <button type="submit" className="primary-button" disabled={isSubmitting || !scan}>
              {isSubmitting ? "Création…" : "Créer la série"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
