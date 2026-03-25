import { useEffect, useRef, useState } from "react";
import {
  listCatalogGenres,
  refreshSeriesFromDir,
  renameEpisodeAdmin,
  renameSeasonAdmin,
  updateSeriesMeta,
  type CatalogGenre,
  type MediaGenre,
  type MediaStatus,
  type SeasonItem,
} from "../../lib/api";

type Props = {
  slug: string;
  title: string;
  synopsis: string;
  releaseYear: number | null;
  status: MediaStatus;
  genres: MediaGenre[];
  hasDirPath: boolean;
  seasons: SeasonItem[];
  onClose: () => void;
  onUpdated: () => void;
};

export function SeriesEditPopup({
  slug,
  title: initialTitle,
  synopsis: initialSynopsis,
  releaseYear: initialReleaseYear,
  status: initialStatus,
  genres: initialGenres,
  hasDirPath,
  seasons,
  onClose,
  onUpdated,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // ─── Part 1: Metadata edit ────────────────────────────────────────────────
  const [title, setTitle] = useState(initialTitle);
  const [synopsis, setSynopsis] = useState(initialSynopsis);
  const [releaseYear, setReleaseYear] = useState(initialReleaseYear?.toString() ?? "");
  const [status, setStatus] = useState<"published" | "draft" | "archived">(initialStatus);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(initialGenres.map((g) => g.id));
  const [allGenres, setAllGenres] = useState<CatalogGenre[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─── Part 2: Refresh + rename ─────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ addedSeasons: number; addedEpisodes: number } | null>(null);
  const [refreshError, setRefreshError] = useState("");
  const [openSeasons, setOpenSeasons] = useState<Set<string>>(new Set());

  // Controlled rename state
  const [seasonTitles, setSeasonTitles] = useState<Record<number, string>>(() =>
    Object.fromEntries(seasons.map((s) => [s.number, s.title ?? ""])),
  );
  const [episodeTitles, setEpisodeTitles] = useState<Record<string, string>>(() =>
    Object.fromEntries(seasons.flatMap((s) => s.episodes.map((ep) => [ep.id, ep.title]))),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => { event.preventDefault(); onClose(); };
    dialog.addEventListener("cancel", handleCancel);
    dialog.showModal();
    document.body.style.overflow = "hidden";
    listCatalogGenres("series").then((res) => setAllGenres(res.items)).catch(() => {});
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

  const handleSaveMetadata = async () => {
    setSaveError("");
    setSaveSuccess(false);
    if (!title.trim()) { setSaveError("Le titre est obligatoire."); return; }
    if (!synopsis.trim()) { setSaveError("Le synopsis est obligatoire."); return; }
    setIsSaving(true);
    try {
      await updateSeriesMeta(slug, {
        title: title.trim(),
        synopsis: synopsis.trim(),
        releaseYear: releaseYear ? Number(releaseYear) : null,
        status,
        genreIds: selectedGenreIds,
      });

      // Sauvegarder les renames de saisons/épisodes qui ont changé
      for (const season of seasons) {
        const newTitle = seasonTitles[season.number]?.trim() ?? "";
        const originalTitle = season.title ?? "";
        if (newTitle !== originalTitle) {
          await renameSeasonAdmin(slug, season.number, newTitle || `Saison ${season.number}`).catch(() => {});
        }
        for (const ep of season.episodes) {
          const newEpTitle = episodeTitles[ep.id]?.trim() ?? "";
          if (newEpTitle && newEpTitle !== ep.title) {
            await renameEpisodeAdmin(ep.id, newEpTitle).catch(() => {});
          }
        }
      }

      setSaveSuccess(true);
      onUpdated();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Sauvegarde impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshError("");
    setRefreshResult(null);
    setIsRefreshing(true);
    try {
      const result = await refreshSeriesFromDir(slug);
      setRefreshResult(result);
      onUpdated();
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Actualisation impossible.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleSeason = (id: string) => {
    setOpenSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
            {saveSuccess && <p className="scan-preview-ok" style={{ marginBottom: 10 }}>✅ Modifications enregistrées.</p>}

            <div className="form-grid">
              <label className="upload-field full-width">
                Titre <span className="required-mark">*</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setSaveSuccess(false); }}
                  maxLength={200}
                />
              </label>

              <label className="upload-field full-width">
                Synopsis <span className="required-mark">*</span>
                <textarea
                  value={synopsis}
                  onChange={(e) => { setSynopsis(e.target.value); setSaveSuccess(false); }}
                  maxLength={2000}
                  rows={3}
                />
              </label>

              <label className="upload-field">
                Année de sortie
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => { setReleaseYear(e.target.value); setSaveSuccess(false); }}
                  min={1888}
                  max={2100}
                  placeholder="2024"
                />
              </label>

              <label className="upload-field">
                Statut
                <select value={status} onChange={(e) => { setStatus(e.target.value as "published" | "draft" | "archived"); setSaveSuccess(false); }}>
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
                      onClick={() => { toggleGenre(genre.id); setSaveSuccess(false); }}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid var(--border-color, #333)" }} />

          {/* ── Part 2: Refresh + rename ── */}
          <section className="series-edit-section">
            <p className="upload-field-label" style={{ marginBottom: 14 }}>Contenu</p>

            {hasDirPath && (
              <div className="series-edit-refresh" style={{ marginBottom: 20 }}>
                <p className="muted" style={{ marginBottom: 10, fontSize: "0.85rem" }}>
                  Actualise depuis le répertoire source pour détecter les nouveaux épisodes et saisons.
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Actualisation..." : "Actualiser depuis le répertoire"}
                </button>
                {refreshResult && (
                  <p className="scan-preview-ok" style={{ marginTop: 8 }}>
                    ✅ {refreshResult.addedSeasons} nouvelle(s) saison(s), {refreshResult.addedEpisodes} nouvel(s) épisode(s) ajouté(s).
                  </p>
                )}
                {refreshError && <p className="form-error" style={{ marginTop: 8 }}>{refreshError}</p>}
              </div>
            )}

            <p className="muted" style={{ marginBottom: 12, fontSize: "0.85rem" }}>
              Modifie un titre puis clique sur &quot;Enregistrer les modifications&quot;.
            </p>

            {seasons.length === 0 ? (
              <p className="muted">Aucune saison pour l&apos;instant.</p>
            ) : (
              seasons.map((season) => (
                <div key={season.id} className="series-edit-season">
                  <div
                    className="series-edit-season-header"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => toggleSeason(season.id)}
                  >
                    <span className="series-edit-season-num">
                      {openSeasons.has(season.id) ? "▾" : "▸"} Saison {season.number}
                    </span>
                    <input
                      type="text"
                      className="series-edit-title-input"
                      value={seasonTitles[season.number] ?? ""}
                      placeholder={`Saison ${season.number}`}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSeasonTitles((prev) => ({ ...prev, [season.number]: e.target.value }))}
                    />
                  </div>

                  {openSeasons.has(season.id) && season.episodes.map((ep) => (
                    <div key={ep.id} className="series-edit-episode">
                      <span className="series-edit-ep-num">Ep.{ep.number}</span>
                      <input
                        type="text"
                        className="series-edit-title-input"
                        value={episodeTitles[ep.id] ?? ""}
                        onChange={(e) => setEpisodeTitles((prev) => ({ ...prev, [ep.id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              ))
            )}
          </section>

          {/* ── Bottom actions ── */}
          <div className="upload-form-actions" style={{ marginTop: 24 }}>
            <button type="button" className="secondary-button" onClick={onClose}>Annuler</button>
            <button type="button" className="primary-button" disabled={isSaving} onClick={() => void handleSaveMetadata()}>
              {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
