import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getEpisode,
  getEpisodeProgress,
  getEpisodeStreamUrl,
  saveEpisodeProgress,
  type EpisodeDetail,
} from "../lib/api";

export function EpisodePlayerPage() {
  const { episodeId } = useParams<{ slug: string; episodeId: string }>();
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [startPosition, setStartPosition] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!episodeId) return;
    setIsLoading(true);
    Promise.all([
      getEpisode(episodeId),
      getEpisodeProgress(episodeId),
    ])
      .then(([epRes, progRes]) => {
        setEpisode(epRes.episode);
        if (progRes.progress && !progRes.progress.completed && progRes.progress.positionSeconds > 5) {
          setStartPosition(progRes.progress.positionSeconds);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  }, [episodeId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId || startPosition === null) return;
    video.currentTime = startPosition;
  }, [episodeId, startPosition]);

  const saveProgress = () => {
    const video = videoRef.current;
    if (!video || !episodeId) return;
    const completed = video.duration > 0 && video.currentTime / video.duration > 0.9;
    void saveEpisodeProgress(
      episodeId,
      video.currentTime,
      video.duration || undefined,
      completed,
    );
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId) return;

    const handlePause = () => saveProgress();

    video.addEventListener("pause", handlePause);
    saveTimerRef.current = setInterval(saveProgress, 10_000);

    return () => {
      video.removeEventListener("pause", handlePause);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      saveProgress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  if (isLoading) return <section className="page-section"><p className="muted">Chargement…</p></section>;
  if (error) return <section className="page-section"><p className="form-error">{error}</p></section>;
  if (!episode) return null;

  const serieSlug = episode.season.serie.media.slug;
  const serieTitle = episode.season.serie.media.title;

  return (
    <section className="page-section episode-player-page">
      <div className="episode-breadcrumb">
        <Link to={`/series/${serieSlug}`} className="episode-breadcrumb-link">{serieTitle}</Link>
        <span className="muted"> / </span>
        <span className="muted">
          S{String(episode.season.number).padStart(2, "0")}E{String(episode.number).padStart(2, "0")}
          {episode.season.title ? ` — ${episode.season.title}` : ""}
        </span>
      </div>

      <div className="episode-player-wrapper">
        <video
          ref={videoRef}
          className="episode-video"
          src={getEpisodeStreamUrl(episode.id)}
          controls
          autoPlay
        />
      </div>

      <div className="episode-player-info panel">
        <h2>{episode.title}</h2>
        {episode.durationMinutes && (
          <p className="muted">{episode.durationMinutes} min</p>
        )}
        {episode.synopsis && (
          <p className="episode-synopsis">{episode.synopsis}</p>
        )}
      </div>
    </section>
  );
}
