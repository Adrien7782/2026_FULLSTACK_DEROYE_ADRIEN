import React, { useEffect, useRef, useState } from "react";
import {
  UPLOAD_MAX_IMAGE_MB,
  createAdminSeries,
  listCatalogGenres,
  type CatalogGenre,
} from "../../lib/api";
import { FileUpload } from "./FileUpload";

type Props = {
  onClose: () => void;
  onCreated?: (slug: string) => void;
};

export function SeriesCreatePopup({ onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [genres, setGenres] = useState<CatalogGenre[]>([]);
  const [posterFile, setPosterFile] = useState<File | null>(null);
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

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!title.trim()) { setError("Le titre est obligatoire."); return; }
    if (!synopsis.trim()) { setError("Le synopsis est obligatoire."); return; }
    if (posterFile && posterFile.size > UPLOAD_MAX_IMAGE_MB * 1024 * 1024) {
      setError(`L'affiche dépasse la limite autorisée (${UPLOAD_MAX_IMAGE_MB} Mo max).`);
      return;
    }

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("synopsis", synopsis.trim());
    fd.set("status", status);
    if (releaseYear) fd.set("releaseYear", releaseYear);
    if (selectedGenreIds.length > 0) fd.set("genreIds", JSON.stringify(selectedGenreIds));
    if (posterFile) { fd.set("poster", posterFile); fd.set("posterSourceMode", "upload"); }

    setIsSubmitting(true);
    try {
      const result = await createAdminSeries(fd);
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
            x
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="upload-form">
          {error && <p className="form-error">{error}</p>}

          <div className="form-grid">
            <label className="upload-field full-width">
              Titre <span className="required-mark">*</span>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Breaking Bad" maxLength={200} required />
            </label>

            <label className="upload-field full-width">
              Synopsis <span className="required-mark">*</span>
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Description de la série..." maxLength={2000} rows={3} required />
            </label>

            <label className="upload-field">
              Année de sortie
              <input type="number" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)}
                min={1888} max={2100} placeholder="2024" />
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
                  <button key={genre.id} type="button"
                    className={`genre-chip upload-genre-chip${selectedGenreIds.includes(genre.id) ? " is-selected" : ""}`}
                    onClick={() => toggleGenre(genre.id)}>
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="upload-field">
            <span className="upload-field-label">Affiche (optionnelle)</span>
            <FileUpload
              label="Affiche"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              hint={`Cliquer pour sélectionner (jpeg, png, webp) - max ${UPLOAD_MAX_IMAGE_MB} Mo`}
              file={posterFile}
              progress={null}
              onFileChange={setPosterFile}
            />
          </div>

          <div className="upload-form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Création…" : "Créer la série"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
