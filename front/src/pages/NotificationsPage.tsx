import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../lib/api";

const TYPE_ICON: Record<string, string> = {
  suggestion_accepted: "✓",
  suggestion_refused: "✕",
  suggestion_processed: "🎬",
  new_episode: "▶",
};

const TYPE_COLOR: Record<string, string> = {
  suggestion_accepted: "#059669",
  suggestion_refused: "#dc2626",
  suggestion_processed: "#2563eb",
  new_episode: "#7c3aed",
};

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setIsLoading(true);
    listNotifications()
      .then((res) => setItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <section className="page-section">
      <div className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Activité</p>
            <h2>Notifications</h2>
          </div>
          {unreadCount > 0 && (
            <button type="button" className="secondary-button" onClick={() => void handleMarkAll()}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {isLoading && <p className="muted">Chargement…</p>}
        {error && <p className="form-error">{error}</p>}

        {!isLoading && items.length === 0 && (
          <div className="empty-state">
            <p className="muted">Aucune notification pour l'instant.</p>
          </div>
        )}

        <div className="notif-list">
          {items.map((notif) => {
            const icon = TYPE_ICON[notif.type] ?? "•";
            const color = TYPE_COLOR[notif.type] ?? "#6b7280";
            const content = (
              <div
                key={notif.id}
                className={`notif-item${notif.isRead ? "" : " is-unread"}`}
                onClick={() => { if (!notif.isRead) void handleMarkRead(notif.id); }}
              >
                <span
                  className="notif-icon"
                  style={{ background: `${color}20`, color }}
                >
                  {icon}
                </span>
                <div className="notif-content">
                  <p className="notif-title">{notif.title}</p>
                  {notif.body && <p className="notif-body muted">{notif.body}</p>}
                  <p className="notif-date muted">
                    {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                {!notif.isRead && <span className="notif-dot" />}
              </div>
            );

            return notif.link ? (
              <Link key={notif.id} to={notif.link} style={{ textDecoration: "none" }}>
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
