import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MediaCard } from "../components/media/MediaCard";
import { FilmEditPopup } from "../components/upload/FilmEditPopup";
import { useSession } from "../auth/useSession";
import {
  deleteRating,
  getMediaAverageRating,
  getMediaDetail,
  getMediaPosterUrl,
  getMediaRatings,
  getMediaStreamUrl,
  getPlayback,
  getRating,
  getFavoriteStatus,
  getWatchlistStatus,
  savePlayback,
  toggleFavorite,
  toggleWatchlist,
  upsertRating,
  type MediaDetailResponse,
  type MediaRatingEntry,
} from "../lib/api";

const deleteMediaFromCatalog = (slug: string) =>
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

export function FilmDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const isAdmin = user?.role === "admin";

  const [detail, setDetail] = useState<MediaDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showEditPopup, setShowEditPopup] = useState(false);

  const [favorited, setFavorited] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<{ average: number | null; count: number } | null>(null);
  const [ratings, setRatings] = useState<MediaRatingEntry[]>([]);
  const [resumePosition, setResumePosition] = useState(0);

  // Refs stables pour les handlers vidéo (évite les stale closures)
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaIdRef = useRef<string>("");
  const lastSavedRef = useRef(0); // timestamp du dernier save (ms)

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!slug) { setError("Slug manquant"); setIsLoading(false); return; }
      setIsLoading(true); setError("");
      try {
        const payload = await getMediaDetail(slug);
        if (!isMounted) return;
        setDetail(payload);
        mediaIdRef.current = payload.item.id;

        const [fav, wl, rating, avg, playback, ratingsRes] = await Promise.allSettled([
          getFavoriteStatus(payload.item.id),
          getWatchlistStatus(payload.item.id),
          getRating(payload.item.id),
          getMediaAverageRating(payload.item.id),
          getPlayback(payload.item.id),
          getMediaRatings(slug!),
        ]);
        if (!isMounted) return;
        if (fav.status === "fulfilled") setFavorited(fav.value.favorited);
        if (wl.status === "fulfilled") setInWatchlist(wl.value.inWatchlist);
        if (rating.status === "fulfilled") setUserRating(rating.value.value);
        if (avg.status === "fulfilled") setAvgRating(avg.value);
        if (playback.status === "fulfilled" && !playback.value.completed && playback.value.positionSeconds > 5)
          setResumePosition(playback.value.positionSeconds);
        if (ratingsRes.status === "fulfilled") setRatings(ratingsRes.value.ratings);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, [slug, reloadKey]);

  // Sauvegarde finale quand on quitte la page (navigation SPA)
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      const id = mediaIdRef.current;
      if (video && id && video.currentTime >= 1) {
        const dur = Number.isFinite(video.duration) ? video.duration : undefined;
        void savePlayback(id, video.currentTime, dur);
      }
    };
  }, []);

  // ─── Handlers vidéo (event props React — toujours à jour, pas de stale closure) ───

  const doSave = (video: HTMLVideoElement) => {
    const id = mediaIdRef.current;
    if (!id || video.currentTime < 1) return;
    const dur = Number.isFinite(video.duration) ? video.duration : undefined;
    void savePlayback(id, video.currentTime, dur);
    lastSavedRef.current = Date.now();
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (resumePosition > 0) e.currentTarget.currentTime = resumePosition;
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    // Sauvegarde toutes les 10 s de lecture réelle
    if (Date.now() - lastSavedRef.current >= 10_000) {
      doSave(e.currentTarget);
    }
  };

  const handlePause = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    doSave(e.currentTarget);
  };

  const handleEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const id = mediaIdRef.current;
    if (!id) return;
    // dur = durée connue OU position courante si duration est Infinity/NaN
    const dur = Number.isFinite(video.duration) ? video.duration : video.currentTime;
    void savePlayback(id, dur, dur); // completed = true car position/duration >= 0.9
  };

  // ─── Actions interactions ────────────────────────────────────────────────────

  const handleToggleFavorite = async () => {
    if (!detail) return;
    setFavorited((await toggleFavorite(detail.item.id)).favorited);
  };

  const handleToggleWatchlist = async () => {
    if (!detail) return;
    setInWatchlist((await toggleWatchlist(detail.item.id)).inWatchlist);
  };

  const handleDelete = async () => {
    if (!detail) return;
    if (!window.confirm(`Supprimer "${detail.item.title}" du catalogue ? Cette action est irréversible.`)) return;
    await deleteMediaFromCatalog(detail.item.slug);
    navigate("/films");
  };

  const handleRatingChange = async (value: number | null) => {
    if (!detail) return;
    if (value === null) { await deleteRating(detail.item.id); setUserRating(null); }
    else { await upsertRating(detail.item.id, value); setUserRating(value); }
    const [avg, ratingsRes] = await Promise.all([
      getMediaAverageRating(detail.item.id),
      getMediaRatings(detail.item.slug),
    ]);
    setAvgRating(avg);
    setRatings(ratingsRes.ratings);
  };

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Film</p>
        <h2>Chargement de la fiche</h2>
        <p className="muted">La fiche détaillée est en cours de récupération.</p>
      </div>
    </section>
  );

  if (error || !detail) return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Film</p>
        <h2>Impossible d&apos;ouvrir cette fiche</h2>
        <p className="form-error">{error || "Média introuvable"}</p>
        <Link className="secondary-link" to="/films">Retour au catalogue</Link>
      </div>
    </section>
  );

  const { item, related } = detail;
  const streamUrl = getMediaStreamUrl(item.slug);
  const posterUrl = getMediaPosterUrl(item.slug);
  const playerPoster = item.hasPoster ? posterUrl : undefined;
  const statusLabel = item.status === "draft" ? "Brouillon" : item.status === "archived" ? "Archivé" : "Publié";

  return (
    <section className="page-section">
      <div className="panel detail-hero">
        <div className="detail-hero-content">
          <p className="eyebrow">Fiche film</p>
          <h2>{item.title}</h2>
          <span className={`media-status-badge is-${item.status}`}>{statusLabel}</span>
          <p className="muted">{item.synopsis}</p>

          <div className="chip-row">
            {item.genres.map((genre) => (
              <Link key={genre.id} to={`/films?genre=${genre.slug}`} className="genre-chip is-link">
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
              <strong>{item.releaseYear ?? "Inconnue"}</strong>
            </div>
            <div className="status-card">
              <span className="status-label">Durée</span>
              <strong>{item.durationMinutes ? `${item.durationMinutes} min` : "Inconnue"}</strong>
            </div>
            <div className="status-card">
              <span className="status-label">Position</span>
              <strong>#{item.stats.catalogPosition}</strong>
              <p>{item.stats.genreCount} genre(s)</p>
            </div>
          </div>

          {isAdmin && (
            <div className="admin-danger-zone">
              <button type="button" className="secondary-button" onClick={() => setShowEditPopup(true)}>
                Modifier contenu
              </button>
              <button type="button" className="danger-button" onClick={() => void handleDelete()}>
                Supprimer du catalogue
              </button>
            </div>
          )}
        </div>

        <div className="detail-poster">
          {item.hasPoster ? (
            <img src={posterUrl} alt={`Affiche de ${item.title}`} />
          ) : (
            <div className="media-card-fallback is-large" aria-hidden="true">
              <span>{getFallbackLabel(item.title)}</span>
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

        {item.hasVideo ? (
          <div className="media-player-section">
            <div className="media-player-shell">
              <video
                ref={videoRef}
                className="media-player"
                controls
                preload="metadata"
                poster={playerPoster}
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
          </div>
        ) : (
          <div className="empty-state">
            <p className="muted">Aucun fichier vidéo rattaché à ce film.</p>
          </div>
        )}
      </div>

      {/* Avis des utilisateurs */}
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Communauté</p>
            <h3>Avis des utilisateurs {ratings.length > 0 && <span className="rating-count">({ratings.length})</span>}</h3>
          </div>
        </div>
        {ratings.length === 0 ? (
          <div className="empty-state">
            <p className="muted">Aucun avis pour le moment. Sois le premier à noter ce film !</p>
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

      {/* Films liés */}
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">À voir ensuite</p>
            <h3>Films liés</h3>
          </div>
        </div>
        {related.length > 0 ? (
          <div className="media-grid">
            {related.map((media) => <MediaCard key={media.id} media={media} />)}
          </div>
        ) : (
          <div className="empty-state">
            <p className="muted">Aucun autre film partageant ces genres pour le moment.</p>
          </div>
        )}
      </div>

      {showEditPopup && (
        <FilmEditPopup
          slug={item.slug}
          title={item.title}
          synopsis={item.synopsis}
          releaseYear={item.releaseYear}
          status={item.status}
          genres={item.genres}
          onClose={() => setShowEditPopup(false)}
          onUpdated={() => setReloadKey((k) => k + 1)}
        />
      )}
    </section>
  );
}
