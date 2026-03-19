import React, { useEffect, useRef, useState } from "react";
import {
  UPLOAD_MAX_IMAGE_MB,
  UPLOAD_MAX_VIDEO_MB,
  getUploadTooLargeMessage,
  listCatalogGenres,
  validateMediaPath,
  type CatalogGenre,
} from "../../lib/api";
import { useUpload } from "../../upload/useUpload";
import { FileUpload } from "./FileUpload";

type UploadPopupProps = {
  onClose: () => void;
};

type PathValidationState = {
  status: "idle" | "validating" | "valid" | "invalid";
  message: string;
};

const idleValidationState: PathValidationState = {
  status: "idle",
  message: "",
};

export function UploadPopup({ onClose }: UploadPopupProps) {
  const { startUpload } = useUpload();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [genres, setGenres] = useState<CatalogGenre[]>([]);
  const [videoSourceMode, setVideoSourceMode] = useState<"reference" | "upload">("reference");
  const [posterSourceMode, setPosterSourceMode] = useState<"reference" | "upload">("reference");
  const [videoPath, setVideoPath] = useState("");
  const [posterPath, setPosterPath] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoPathValidation, setVideoPathValidation] = useState<PathValidationState>(idleValidationState);
  const [posterPathValidation, setPosterPathValidation] = useState<PathValidationState>(idleValidationState);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.showModal();
    document.body.style.overflow = "hidden";
    listCatalogGenres("film")
      .then((res) => setGenres(res.items))
      .catch(() => {});
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (videoSourceMode !== "reference") {
      setVideoPathValidation(idleValidationState);
      return;
    }

    const trimmedPath = videoPath.trim();
    if (!trimmedPath) {
      setVideoPathValidation(idleValidationState);
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setVideoPathValidation({
        status: "validating",
        message: "Verification du chemin...",
      });

      validateMediaPath(trimmedPath, "video")
        .then((payload) => {
          if (!isMounted) {
            return;
          }

          setVideoPathValidation({
            status: payload.found ? "valid" : "invalid",
            message: payload.message,
          });
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }

          setVideoPathValidation({
            status: "invalid",
            message: "Aucun element trouve",
          });
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [videoPath, videoSourceMode]);

  useEffect(() => {
    if (posterSourceMode !== "reference") {
      setPosterPathValidation(idleValidationState);
      return;
    }

    const trimmedPath = posterPath.trim();
    if (!trimmedPath) {
      setPosterPathValidation(idleValidationState);
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setPosterPathValidation({
        status: "validating",
        message: "Verification du chemin...",
      });

      validateMediaPath(trimmedPath, "poster")
        .then((payload) => {
          if (!isMounted) {
            return;
          }

          setPosterPathValidation({
            status: payload.found ? "valid" : "invalid",
            message: payload.message,
          });
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }

          setPosterPathValidation({
            status: "invalid",
            message: "Aucun element trouve",
          });
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [posterPath, posterSourceMode]);

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((genreId) => genreId !== id) : [...prev, id],
    );
  };

  const validateFiles = () => {
    if (
      videoSourceMode === "upload" &&
      videoFile &&
      videoFile.size > UPLOAD_MAX_VIDEO_MB * 1024 * 1024
    ) {
      return `La video depasse la limite autorisee (${UPLOAD_MAX_VIDEO_MB} Mo max).`;
    }

    if (
      posterSourceMode === "upload" &&
      posterFile &&
      posterFile.size > UPLOAD_MAX_IMAGE_MB * 1024 * 1024
    ) {
      return `L'affiche depasse la limite autorisee (${UPLOAD_MAX_IMAGE_MB} Mo max).`;
    }

    return "";
  };

  const isPathValidationPending =
    videoPathValidation.status === "validating" || posterPathValidation.status === "validating";
  const isRequiredUploadMissing =
    (videoSourceMode === "upload" && !videoFile) ||
    (posterSourceMode === "upload" && !posterFile);
  const hasInvalidReference =
    (videoSourceMode === "reference" &&
      (!videoPath.trim() || videoPathValidation.status !== "valid")) ||
    (posterSourceMode === "reference" &&
      (!posterPath.trim() || posterPathValidation.status !== "valid"));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }

    if (!synopsis.trim()) {
      setError("Le synopsis est obligatoire.");
      return;
    }

    if (videoSourceMode === "reference" && !videoPath.trim()) {
      setError("Le chemin local de la video est obligatoire.");
      return;
    }

    if (videoSourceMode === "reference" && videoPathValidation.status === "validating") {
      setError("La verification du chemin video est encore en cours.");
      return;
    }

    if (videoSourceMode === "reference" && videoPathValidation.status !== "valid") {
      setError("Le chemin video est invalide.");
      return;
    }

    if (videoSourceMode === "upload" && !videoFile) {
      setError("Le fichier video est obligatoire.");
      return;
    }

    if (posterSourceMode === "reference" && !posterPath.trim()) {
      setError("Le chemin local de l'affiche est obligatoire.");
      return;
    }

    if (posterSourceMode === "reference" && posterPathValidation.status === "validating") {
      setError("La verification du chemin de l'affiche est encore en cours.");
      return;
    }

    if (posterSourceMode === "reference" && posterPathValidation.status !== "valid") {
      setError("Le chemin de l'affiche est invalide.");
      return;
    }

    if (posterSourceMode === "upload" && !posterFile) {
      setError("Le fichier affiche est obligatoire.");
      return;
    }

    const sizeError = validateFiles();
    if (sizeError) {
      setError(sizeError);
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("synopsis", synopsis.trim());
    formData.set("status", status);

    if (releaseYear) {
      formData.set("releaseYear", releaseYear);
    }

    if (durationMinutes) {
      formData.set("durationMinutes", durationMinutes);
    }

    if (selectedGenreIds.length > 0) {
      formData.set("genreIds", JSON.stringify(selectedGenreIds));
    }

    formData.set("videoSourceMode", videoSourceMode);
    formData.set("posterSourceMode", posterSourceMode);

    if (videoSourceMode === "reference") {
      formData.set("videoPath", videoPath.trim());
    } else if (videoFile) {
      formData.set("video", videoFile);
    }

    if (posterSourceMode === "reference" && posterPath.trim()) {
      formData.set("posterPath", posterPath.trim());
    } else if (posterFile) {
      formData.set("poster", posterFile);
    }

    if (videoSourceMode === "reference") {
      setIsSubmitting(true);

      try {
        await startUpload(title.trim(), formData);
        onClose();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Creation du media impossible.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    void startUpload(title.trim(), formData);
    onClose();
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog ref={dialogRef} className="upload-dialog" onClick={handleBackdropClick}>
      <div className="upload-dialog-panel">
        <div className="upload-dialog-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h2>Ajouter un film</h2>
          </div>
          <button
            type="button"
            className="upload-dialog-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {error && <p className="form-error">{error}</p>}

          <div className="form-grid">
            <label className="upload-field full-width">
              Titre <span className="required-mark">*</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Blade Runner 2049"
                maxLength={200}
                required
              />
            </label>

            <label className="upload-field full-width">
              Synopsis <span className="required-mark">*</span>
              <textarea
                value={synopsis}
                onChange={(event) => setSynopsis(event.target.value)}
                placeholder="Description du film..."
                maxLength={2000}
                rows={3}
                required
              />
            </label>

            <label className="upload-field">
              Annee de sortie
              <input
                type="number"
                value={releaseYear}
                onChange={(event) => setReleaseYear(event.target.value)}
                min={1888}
                max={2100}
                placeholder="2024"
              />
            </label>

            <label className="upload-field">
              Duree (minutes)
              <input
                type="number"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                min={1}
                max={999}
                placeholder="120"
              />
            </label>

            <label className="upload-field">
              Statut
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "published" | "draft")}
              >
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
                    className={`genre-chip upload-genre-chip${
                      selectedGenreIds.includes(genre.id) ? " is-selected" : ""
                    }`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="upload-source-grid">
            <section className="upload-source-panel">
              <div className="upload-source-header">
                <div>
                  <strong>Video</strong>
                </div>
                <div className="source-mode-toggle" role="tablist" aria-label="Mode video">
                  <button
                    type="button"
                    className={videoSourceMode === "reference" ? "is-active" : ""}
                    onClick={() => setVideoSourceMode("reference")}
                  >
                    Chemin local
                  </button>
                  <button
                    type="button"
                    className={videoSourceMode === "upload" ? "is-active" : ""}
                    onClick={() => setVideoSourceMode("upload")}
                  >
                    Importer
                  </button>
                </div>
              </div>

              {videoSourceMode === "reference" ? (
                <label className="upload-field">
                  Chemin local video <span className="required-mark">*</span>
                  <input
                    type="text"
                    value={videoPath}
                    onChange={(event) => setVideoPath(event.target.value)}
                    placeholder="Ex: C:\\Films\\Blade Runner 2049.mp4 ou videos/blade-runner-2049.mp4"
                    required
                  />
                  {videoPathValidation.status !== "idle" && (
                    <p
                      className={`path-feedback ${
                        videoPathValidation.status === "valid"
                          ? "is-valid"
                          : videoPathValidation.status === "invalid"
                            ? "is-invalid"
                            : ""
                      }`}
                    >
                      {videoPathValidation.message}
                    </p>
                  )}
                </label>
              ) : (
                <FileUpload
                  label="Fichier video"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                  hint={`Cliquer pour selectionner (mp4, webm, mov) - max ${UPLOAD_MAX_VIDEO_MB} Mo`}
                  file={videoFile}
                  progress={null}
                  onFileChange={setVideoFile}
                />
              )}
            </section>

            <section className="upload-source-panel">
              <div className="upload-source-header">
                <div>
                  <strong>Affiche <span className="required-mark">*</span></strong>
                </div>
                <div className="source-mode-toggle" role="tablist" aria-label="Mode affiche">
                  <button
                    type="button"
                    className={posterSourceMode === "reference" ? "is-active" : ""}
                    onClick={() => setPosterSourceMode("reference")}
                  >
                    Chemin local
                  </button>
                  <button
                    type="button"
                    className={posterSourceMode === "upload" ? "is-active" : ""}
                    onClick={() => setPosterSourceMode("upload")}
                  >
                    Importer
                  </button>
                </div>
              </div>

              {posterSourceMode === "reference" ? (
                <label className="upload-field">
                  Chemin local affiche <span className="required-mark">*</span>
                  <input
                    type="text"
                    value={posterPath}
                    onChange={(event) => setPosterPath(event.target.value)}
                    placeholder="Ex: C:\\Affiches\\blade-runner-2049.jpg ou posters/blade-runner-2049.webp"
                  />
                  {posterPathValidation.status !== "idle" && (
                    <p
                      className={`path-feedback ${
                        posterPathValidation.status === "valid"
                          ? "is-valid"
                          : posterPathValidation.status === "invalid"
                            ? "is-invalid"
                            : ""
                      }`}
                    >
                      {posterPathValidation.message}
                    </p>
                  )}
                </label>
              ) : (
                <FileUpload
                  label="Affiche obligatoire"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.jpg,.jpeg,.png,.gif,.webp,.svg"
                  hint={`Cliquer pour selectionner (jpeg, png, svg) - max ${UPLOAD_MAX_IMAGE_MB} Mo`}
                  file={posterFile}
                  progress={null}
                  onFileChange={setPosterFile}
                />
              )}
            </section>
          </div>

          <p className="upload-limit-note muted">{getUploadTooLargeMessage()}</p>
          <p className="upload-limit-note muted">
            En mode chemin local, le backend reference directement le fichier sans le copier.
          </p>

          <div className="upload-form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={
                isSubmitting ||
                isPathValidationPending ||
                hasInvalidReference ||
                isRequiredUploadMissing
              }
            >
              {isSubmitting ? "Validation..." : "Lancer l'upload"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
