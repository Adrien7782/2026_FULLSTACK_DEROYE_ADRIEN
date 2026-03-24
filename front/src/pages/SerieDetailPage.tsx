import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../auth/useSession";
import {
  addAdminEpisode,
  addAdminSeason,
  deleteRating,
  getEpisodeProgress,
  getEpisodeStreamUrl,
  getMediaAverageRating,
  getMediaPosterUrl,
  getMediaRatings,
  getRating,
  getFavoriteStatus,
  getWatchlistStatus,
  getSerieDetail,
  getSerieResume,
  saveEpisodeProgress,
  toggleFavorite,
  toggleWatchlist,
  upsertRating,
  type EpisodeItem,
  type MediaRatingEntry,
  type SeasonItem,
  type SerieDetailResponse,
} from "../lib/api";

const deleteSerieFromCatalog = (slug: string) =>
  fetch(`/api/admin/media/${slug}`, { method: "DELETE", credentials: "include" });

const getFallbackLabel = (title: string) =>
  title.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "").join("");

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;
  return (
    <div className="star-rating" aria-label="Note de 1 à 5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          className={`star-btn${display !== null && star <= display ? " is-active" : ""}`}
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(value === star ? null : star)}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}>★</button>
      ))}
      {value !== null && (
        <button type="button" className="star-clear-btn" onClick={() => onChange(null)}>✕</button>
      )}
    </div>
  );
}

export function SerieDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const isAdmin = user?.role === "admin";

  const [serie, setSerie] = useState<SerieDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Episode selection
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

  // Interactions
  const [favorited, setFavorited] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<{ average: number | null; count: number } | null>(null);
  const [ratings, setRatings] = useState<MediaRatingEntry[]>([]);

  // Video progress
  const [resumePosition, setResumePosition] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);
  const currentEpIdRef = useRef<string | null>(null);

  // Admin forms
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [newSeasonNum, setNewSeasonNum] = useState("");
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [seasonFormError, setSeasonFormError] = useState("");

  const [showAddEpisode, setShowAddEpisode] = useState(false);
  const [epNum, setEpNum] = useState("");
  const [epTitle, setEpTitle] = useState("");
  const [epStatus, setEpStatus] = useState<"published" | "draft">("published");
  const [epDuration, setEpDuration] = useState("");
  const [epVideoFile, setEpVideoFile] = useState<File | null>(null);
  const [epFormError, setEpFormError] = useState("");
  const [epSubmitting, setEpSubmitting] = useState(false);

  // ─── Load serie + interactions ────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError("");

    Promise.all([
      getSerieDetail(slug),
      getSerieResume(slug),
    ])
      .then(async ([serieData, resumeData]) => {
        setSerie(serieData);

        // Determine default season/episode from resume
        let defaultEpId: string | null = resumeData.episodeId;
        let defaultSeasonIdx = 0;

        if (defaultEpId) {
          const idx = serieData.seasons.findIndex((s) =>
            s.episodes.some((e) => e.id === defaultEpId),
          );
          if (idx >= 0) defaultSeasonIdx = idx;
        } else if (serieData.seasons.length > 0 && serieData.seasons[0].episodes.length > 0) {
          defaultEpId = serieData.seasons[0].episodes[0].id;
        }

        setSelectedSeasonIdx(defaultSeasonIdx);
        setSelectedEpisodeId(defaultEpId);

        // Interactions (media level)
        const [fav, wl, rating, avg, ratingsRes] = await Promise.allSettled([
          getFavoriteStatus(serieData.id),
          getWatchlistStatus(serieData.id),
          getRating(serieData.id),
          getMediaAverageRating(serieData.id),
          getMediaRatings(slug),
        ]);
        if (fav.status === "fulfilled") setFavorited(fav.value.favorited);
        if (wl.status === "fulfilled") setInWatchlist(wl.value.inWatchlist);
        if (rating.status === "fulfilled") setUserRating(rating.value.value);
        if (avg.status === "fulfilled") setAvgRating(avg.value);
        if (ratingsRes.status === "fulfilled") setRatings(ratingsRes.value.ratings);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setIsLoading(false));
  }, [slug]);

  // ─── Load episode progress when selected episode changes ─────────────────

  useEffect(() => {
    if (!selectedEpisodeId) return;

    // Save progress of previous episode
    const prevId = currentEpIdRef.current;
    const video = videoRef.current;
    if (prevId && video && video.currentTime >= 1) {
      const dur = Number.isFinite(video.duration) ? video.duration : undefined;
      const completed = dur ? video.currentTime / dur > 0.9 : false;
      void saveEpisodeProgress(prevId, video.currentTime, dur, completed);
    }

    currentEpIdRef.current = selectedEpisodeId;

    // Load progress of new episode
    getEpisodeProgress(selectedEpisodeId)
      .then((res) => {
        if (res.progress && !res.progress.completed && res.progress.positionSeconds > 5) {
          setResumePosition(res.progress.positionSeconds);
        } else {
          setResumePosition(0);
        }
      })
      .catch(() => setResumePosition(0));
  }, [selectedEpisodeId]);

  // Save on unmount
  useEffect(() => {
    return () => {
      const id = currentEpIdRef.current;
      const video = videoRef.current;
      if (id && video && video.currentTime >= 1) {
        const dur = Number.isFinite(video.duration) ? video.duration : undefined;
        const completed = dur ? video.currentTime / dur > 0.9 : false;
        void saveEpisodeProgress(id, video.currentTime, dur, completed);
      }
    };
  }, []);

  // ─── Video handlers ───────────────────────────────────────────────────────

  const doSave = (video: HTMLVideoElement) => {
    const id = currentEpIdRef.current;
    if (!id || video.currentTime < 1) return;
    const dur = Number.isFinite(video.duration) ? video.duration : undefined;
    const completed = dur ? video.currentTime / dur > 0.9 : false;
    void saveEpisodeProgress(id, video.currentTime, dur, completed);
    lastSavedRef.current = Date.now();
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (resumePosition > 0) e.currentTarget.currentTime = resumePosition;
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (Date.now() - lastSavedRef.current >= 10_000) doSave(e.currentTarget);
  };

  const handlePause = (e: React.SyntheticEvent<HTMLVideoElement>) => doSave(e.currentTarget);

  const handleEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const id = currentEpIdRef.current;
    if (!id) return;
    const dur = Number.isFinite(video.duration) ? video.duration : video.currentTime;
    void saveEpisodeProgress(id, dur, dur, true);
  };

  // ─── Interaction handlers ─────────────────────────────────────────────────

  const handleToggleFavorite = async () => {
    if (!serie) return;
    setFavorited((await toggleFavorite(serie.id)).favorited);
  };

  const handleToggleWatchlist = async () => {
    if (!serie) return;
    setInWatchlist((await toggleWatchlist(serie.id)).inWatchlist);
  };

  const handleDelete = async () => {
    if (!serie) return;
    if (!window.confirm(`Supprimer "${serie.title}" du catalogue ? Cette action est irréversible.`)) return;
    await deleteSerieFromCatalog(serie.slug);
    navigate("/series");
  };

  const handleRatingChange = async (value: number | null) => {
    if (!serie) return;
    if (value === null) { await deleteRating(serie.id); setUserRating(null); }
    else { await upsertRating(serie.id, value); setUserRating(value); }
    const [avg, ratingsRes] = await Promise.all([
      getMediaAverageRating(serie.id),
      getMediaRatings(serie.slug),
    ]);
    setAvgRating(avg);
    setRatings(ratingsRes.ratings);
  };

  // ─── Admin handlers ───────────────────────────────────────────────────────

  const handleAddSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeasonFormError("");
    const num = parseInt(newSeasonNum, 10);
    if (!num || num < 1) { setSeasonFormError("Numéro de saison invalide."); return; }
    try {
      await addAdminSeason(slug!, { number: num, title: newSeasonTitle || undefined });
      const updated = await getSerieDetail(slug!);
      setSerie(updated);
      setShowAddSeason(false);
      setNewSeasonNum(""); setNewSeasonTitle("");
    } catch (err) {
      setSeasonFormError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEpFormError("");
    if (!serie) return;
    const currentSeason = serie.seasons[selectedSeasonIdx];
    if (!currentSeason) { setEpFormError("Sélectionne une saison d'abord."); return; }
    const num = parseInt(epNum, 10);
    if (!num || num < 1) { setEpFormError("Numéro d'épisode invalide."); return; }
    if (!epTitle.trim()) { setEpFormError("Le titre est obligatoire."); return; }

    const fd = new FormData();
    fd.set("number", String(num));
    fd.set("title", epTitle.trim());
    fd.set("status", epStatus);
    if (epDuration) fd.set("durationMinutes", epDuration);
    if (epVideoFile) { fd.set("video", epVideoFile); fd.set("videoSourceMode", "upload"); }

    setEpSubmitting(true);
    try {
      await addAdminEpisode(slug!, currentSeason.number, fd);
      const updated = await getSerieDetail(slug!);
      setSerie(updated);
      setShowAddEpisode(false);
      setEpNum(""); setEpTitle(""); setEpDuration(""); setEpVideoFile(null);
    } catch (err) {
      setEpFormError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEpSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Série</p>
        <h2>Chargement de la fiche</h2>
        <p className="muted">La fiche détaillée est en cours de récupération.</p>
      </div>
    </section>
  );

  if (error || !serie) return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Série</p>
        <h2>Impossible d&apos;ouvrir cette fiche</h2>
        <p className="form-error">{error || "Série introuvable"}</p>
        <Link className="secondary-link" to="/series">Retour au catalogue</Link>
      </div>
    </section>
  );

  const posterUrl = getMediaPosterUrl(serie.slug);
  const statusLabel = serie.status === "draft" ? "Brouillon" : serie.status === "archived" ? "Archivé" : "Publié";
  const totalEpisodes = serie.seasons.reduce((sum, s) => sum + s.episodeCount, 0);

  const currentSeason: SeasonItem | undefined = serie.seasons[selectedSeasonIdx];
  const currentEpisode: EpisodeItem | undefined = currentSeason?.episodes.find(
    (e) => e.id === selectedEpisodeId,
  ) ?? currentSeason?.episodes[0];
  const streamUrl = currentEpisode?.hasVideo ? getEpisodeStreamUrl(currentEpisode.id) : null;

  return (
    <section className="page-section">
      {/* Hero */}
      <div className="panel detail-hero">
        <div className="detail-hero-content">
          <p className="eyebrow">Fiche série</p>
          <h2>{serie.title}</h2>
          <span className={`media-status-badge is-${serie.status}`}>{statusLabel}</span>
          <p className="muted">{serie.synopsis}</p>

          <div className="chip-row">
            {serie.genres.map((genre) => (
              <Link key={genre.id} to={`/series?genre=${genre.slug}`} className="genre-chip is-link">
                {genre.name}
              </Link>
            ))}
          </div>

          <div className="interaction-bar">
            <button type="button" className={`icon-btn${favorited ? " is-active" : ""}`}
              onClick={() => void handleToggleFavorite()}>
              {favorited ? "♥" : "♡"} Favori
            </button>
            <button type="button" className={`icon-btn${inWatchlist ? " is-active" : ""}`}
              onClick={() => void handleToggleWatchlist()}>
              {inWatchlist ? "✓" : "+"} Ma liste
            </button>
            <div className="rating-block">
              <StarRating value={userRating} onChange={(v) => void handleRatingChange(v)} />
              {avgRating && avgRating.count > 0 && (
                <span className="avg-rating">{avgRating.average?.toFixed(1)}/5 ({avgRating.count} avis)</span>
              )}
            </div>
          </div>

          <div className="detail-meta-grid">
            <div className="status-card">
              <span className="status-label">Année</span>
              <strong>{serie.releaseYear ?? "Inconnue"}</strong>
            </div>
            <div className="status-card">
              <span className="status-label">Saisons</span>
              <strong>{serie.seasons.length}</strong>
            </div>
            <div className="status-card">
              <span className="status-label">Épisodes</span>
              <strong>{totalEpisodes}</strong>
            </div>
          </div>

          {isAdmin && (
            <div className="admin-danger-zone">
              <button type="button" className="secondary-button"
                onClick={() => { setShowAddSeason(!showAddSeason); setShowAddEpisode(false); }}>
                {showAddSeason ? "Annuler saison" : "+ Saison"}
              </button>
              {serie.seasons.length > 0 && (
                <button type="button" className="secondary-button"
                  onClick={() => { setShowAddEpisode(!showAddEpisode); setShowAddSeason(false); }}>
                  {showAddEpisode ? "Annuler épisode" : "+ Épisode"}
                </button>
              )}
              <button type="button" className="danger-button" onClick={() => void handleDelete()}>
                Supprimer du catalogue
              </button>
            </div>
          )}
        </div>

        <div className="detail-poster">
          {serie.hasPoster ? (
            <img src={posterUrl} alt={`Affiche de ${serie.title}`} />
          ) : (
            <div className="media-card-fallback is-large" aria-hidden="true">
              <span>{getFallbackLabel(serie.title)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lecteur */}
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Lecture</p>
            <h3>Lecteur vidéo intégré</h3>
          </div>
        </div>

        {serie.seasons.length === 0 ? (
          <div className="empty-state">
            <p className="muted">Aucune saison disponible pour l'instant.</p>
          </div>
        ) : (
          <>
            {/* Selectors */}
            <div className="episode-selectors">
              <label className="episode-selector-label">
                Saison
                <select
                  className="episode-selector-select"
                  value={selectedSeasonIdx}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedSeasonIdx(idx);
                    const firstEp = serie.seasons[idx]?.episodes[0];
                    setSelectedEpisodeId(firstEp?.id ?? null);
                  }}
                >
                  {serie.seasons.map((s, i) => (
                    <option key={s.id} value={i}>
                      Saison {s.number}{s.title ? ` — ${s.title}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="episode-selector-label">
                Épisode
                <select
                  className="episode-selector-select"
                  value={selectedEpisodeId ?? ""}
                  onChange={(e) => setSelectedEpisodeId(e.target.value || null)}
                  disabled={!currentSeason || currentSeason.episodes.length === 0}
                >
                  {currentSeason?.episodes.length === 0 && (
                    <option value="">Aucun épisode</option>
                  )}
                  {currentSeason?.episodes.map((ep) => (
                    <option key={ep.id} value={ep.id} disabled={!ep.hasVideo}>
                      E{String(ep.number).padStart(2, "0")} — {ep.title}
                      {!ep.hasVideo ? " (bientôt)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Player */}
            {currentEpisode && streamUrl ? (
              <div className="media-player-section">
                <div className="media-player-shell">
                  <video
                    key={currentEpisode.id}
                    ref={videoRef}
                    className="media-player"
                    controls
                    autoPlay
                    preload="metadata"
                    src={streamUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPause={handlePause}
                    onEnded={handleEnded}
                  >
                    Votre navigateur ne supporte pas la lecture vidéo HTML5.
                  </video>
                </div>
                {resumePosition > 0 && (
                  <p className="muted media-player-caption">
                    Reprise à {Math.floor(resumePosition / 60)}min {Math.floor(resumePosition % 60)}s
                  </p>
                )}
                {currentEpisode.synopsis && (
                  <p className="muted media-player-caption">{currentEpisode.synopsis}</p>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p className="muted">
                  {currentEpisode
                    ? "Aucun fichier vidéo rattaché à cet épisode."
                    : "Sélectionne un épisode pour lancer la lecture."}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin — formulaires inline */}
      {isAdmin && showAddSeason && (
        <div className="panel">
          <form onSubmit={(e) => void handleAddSeason(e)} className="admin-inline-form">
            <h4>Nouvelle saison</h4>
            {seasonFormError && <p className="form-error">{seasonFormError}</p>}
            <div className="form-grid">
              <label className="upload-field">
                Numéro <span className="required-mark">*</span>
                <input type="number" min={1} value={newSeasonNum}
                  onChange={(e) => setNewSeasonNum(e.target.value)} required />
              </label>
              <label className="upload-field">
                Titre (optionnel)
                <input type="text" value={newSeasonTitle}
                  onChange={(e) => setNewSeasonTitle(e.target.value)} maxLength={200} />
              </label>
            </div>
            <div className="upload-form-actions">
              <button type="button" className="secondary-button"
                onClick={() => setShowAddSeason(false)}>Annuler</button>
              <button type="submit" className="primary-button">Créer la saison</button>
            </div>
          </form>
        </div>
      )}

      {isAdmin && showAddEpisode && currentSeason && (
        <div className="panel">
          <form onSubmit={(e) => void handleAddEpisode(e)} className="admin-inline-form">
            <h4>Nouvel épisode — Saison {currentSeason.number}</h4>
            {epFormError && <p className="form-error">{epFormError}</p>}
            <div className="form-grid">
              <label className="upload-field">
                Numéro <span className="required-mark">*</span>
                <input type="number" min={1} value={epNum}
                  onChange={(e) => setEpNum(e.target.value)} required />
              </label>
              <label className="upload-field">
                Titre <span className="required-mark">*</span>
                <input type="text" value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)} maxLength={200} required />
              </label>
              <label className="upload-field">
                Durée (min)
                <input type="number" min={1} max={999} value={epDuration}
                  onChange={(e) => setEpDuration(e.target.value)} />
              </label>
              <label className="upload-field">
                Statut
                <select value={epStatus}
                  onChange={(e) => setEpStatus(e.target.value as "published" | "draft")}>
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                </select>
              </label>
              <label className="upload-field full-width">
                Fichier vidéo (optionnel)
                <input type="file" accept="video/mp4,video/webm,.mp4,.webm,.mov"
                  onChange={(e) => setEpVideoFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="upload-form-actions">
              <button type="button" className="secondary-button"
                onClick={() => setShowAddEpisode(false)}>Annuler</button>
              <button type="submit" className="primary-button" disabled={epSubmitting}>
                {epSubmitting ? "Création…" : "Créer l'épisode"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Avis communauté */}
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Communauté</p>
            <h3>Avis des utilisateurs {ratings.length > 0 && <span className="rating-count">({ratings.length})</span>}</h3>
          </div>
        </div>
        {ratings.length === 0 ? (
          <div className="empty-state">
            <p className="muted">Aucun avis pour le moment. Sois le premier à noter cette série !</p>
          </div>
        ) : (
          <div className="ratings-list">
            {ratings.map((r) => (
              <div key={r.userId} className="rating-row">
                <Link to={`/users/${r.username}`} className="rating-user">
                  <div className="rating-avatar">
                    {r.avatarUrl
                      ? <img src={r.avatarUrl} alt={r.username} />
                      : <span>{r.username.charAt(0).toUpperCase()}</span>}
                  </div>
                  <span className="rating-username">{r.username}</span>
                </Link>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= r.value ? "star is-active" : "star"}>★</span>
                  ))}
                </div>
                <span className="rating-date muted">
                  {new Date(r.updatedAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
