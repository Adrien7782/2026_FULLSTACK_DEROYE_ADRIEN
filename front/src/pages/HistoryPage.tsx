import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMediaPosterUrl, listHistory, type HistoryEntry } from "../lib/api";

function ProgressBar({ position, duration }: { position: number; duration: number | null }) {
  if (!duration || duration === 0) return null;
  const pct = Math.min(100, Math.round((position / duration) * 100));
  return (
    <div className="playback-bar" aria-label={`${pct}% visionné`}>
      <div className="playback-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min ${s}s`;
}

function HistoryPoster({ item }: { item: HistoryEntry }) {
  const [failed, setFailed] = useState(false);
  if (!item.hasPoster || failed) {
    const initials = item.title.split(/\s+/).filter(Boolean).slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "").join("");
    return <div className="history-card-poster is-fallback"><span>{initials}</span></div>;
  }
  return (
    <img
      className="history-card-poster"
      src={getMediaPosterUrl(item.slug)}
      alt={`Affiche de ${item.title}`}
      onError={() => setFailed(true)}
    />
  );
}

export function HistoryPage() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listHistory()
      .then((res) => setItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  }, []);

  const inProgress = items.filter((i) => !i.completed && i.positionSeconds >= 1);
  const completed = items.filter((i) => i.completed);

  return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Fonctionnement</p>
        <h2>Votre historique</h2>
        <p className="muted">
          Ta progression est sauvegardée automatiquement (toutes les 10 secondes, à la pause et en
          quittant la fiche). Un film apparaît ici dès 1 seconde visionnée. Il passe en{" "}
          <strong>Terminé</strong> à 90 % de lecture. Les films restent dans l&apos;historique
          indéfiniment.
        </p>
      </div>

      {inProgress.length > 0 && (
        <div className="panel">
          <p className="eyebrow">En cours</p>
          <h2>Reprendre la lecture</h2>
          <div className="history-list">
            {inProgress.map((item) => (
              <Link key={item.id} to={`/films/${item.slug}`} className="history-card">
                <HistoryPoster item={item} />
                <div className="history-card-info">
                  <strong>{item.title}</strong>
                  <span className="muted">
                    {item.releaseYear} · Reprise à {formatDuration(item.positionSeconds)}
                  </span>
                  <ProgressBar position={item.positionSeconds} duration={item.durationSeconds} />
                </div>
                <span className="history-card-cta">▶ Reprendre</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <p className="eyebrow">Historique</p>
        <h2>Films regardés</h2>

        {isLoading && <p className="muted">Chargement…</p>}
        {error && <p className="form-error">{error}</p>}

        {!isLoading && !error && items.length === 0 && (
          <div className="empty-state">
            <p className="muted">Aucun film regardé pour l&apos;instant.</p>
            <Link to="/films" className="primary-button">Parcourir le catalogue</Link>
          </div>
        )}

        {completed.length > 0 && (
          <div className="history-list">
            {completed.map((item) => (
              <Link key={item.id} to={`/films/${item.slug}`} className="history-card">
                <HistoryPoster item={item} />
                <div className="history-card-info">
                  <strong>{item.title}</strong>
                  <span className="muted">
                    {item.releaseYear} · Terminé le{" "}
                    {new Date(item.watchedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <span className="history-card-badge">✓ Terminé</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
