import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getUserPublicProfile,
  followUser,
  unfollowUser,
  getMediaPosterUrl,
  type PublicUserProfile,
} from "../lib/api";
import { useSession } from "../auth/useSession";

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useSession();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const loadProfile = () => {
    if (!username) return;
    setIsLoading(true);
    getUserPublicProfile(username)
      .then((res) => setProfile(res.user))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadProfile, [username]);

  const handleFollow = async () => {
    if (!profile) return;
    setIsFollowLoading(true);
    try {
      if (profile.followStatus === "accepted") {
        await unfollowUser(profile.id);
      } else if (profile.followStatus === "none") {
        await followUser(profile.id);
      }
      loadProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const isOwnProfile = me?.id === profile?.id;

  if (isLoading) return (
    <section className="page-section">
      <div className="panel"><p className="muted">Chargement…</p></div>
    </section>
  );

  if (error || !profile) return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Profil</p>
        <h2>Utilisateur introuvable</h2>
        <p className="form-error">{error || "Cet utilisateur n'existe pas."}</p>
        <Link className="secondary-link" to="/users">Retour à la recherche</Link>
      </div>
    </section>
  );

  const initials = profile.username.charAt(0).toUpperCase();

  const followLabel = () => {
    if (isFollowLoading) return "…";
    if (profile.followStatus === "accepted") return "Se désabonner";
    if (profile.followStatus === "pending") return "Demande envoyée";
    return "Suivre";
  };

  return (
    <section className="page-section">
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <Link className="secondary-link" to="/users">← Rechercher des utilisateurs</Link>
      </div>

      {/* Profile header */}
      <div className="panel">
        <p className="eyebrow">Profil {!profile.isPublic && "· Privé"}</p>
        <div className="public-profile">
          <div className="public-profile-avatar">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.username} />
              : <span>{initials}</span>}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 4 }}>{profile.username}</h2>
            <p className="muted" style={{ marginBottom: 8 }}>
              Membre depuis {new Date(profile.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
            </p>
            <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
              <span className="muted"><strong>{profile.followerCount}</strong> abonné{profile.followerCount !== 1 ? "s" : ""}</span>
              <span className="muted"><strong>{profile.followingCount}</strong> abonnement{profile.followingCount !== 1 ? "s" : ""}</span>
            </div>
            {me && !isOwnProfile && (
              <button
                type="button"
                className={profile.followStatus === "accepted" ? "secondary-button" : "primary-button"}
                disabled={isFollowLoading || profile.followStatus === "pending"}
                onClick={() => void handleFollow()}
              >
                {followLabel()}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current recommendation */}
      {profile.currentRecommendation && (
        <div className="panel">
          <p className="eyebrow">Recommandation</p>
          <h3 style={{ marginBottom: 8 }}>
            {profile.username} recommande{" "}
            <Link
              to={`/${profile.currentRecommendation.media.type === "film" ? "films" : "series"}/${profile.currentRecommendation.media.slug}`}
              className="primary-link"
            >
              {profile.currentRecommendation.media.title}
            </Link>
          </h3>
          <blockquote className="recommendation-comment">
            &ldquo;{profile.currentRecommendation.comment}&rdquo;
          </blockquote>
        </div>
      )}

      {/* Favorites */}
      {profile.favorites && profile.favorites.length > 0 && (
        <div className="panel">
          <p className="eyebrow">Favoris</p>
          <h3 style={{ marginBottom: 16 }}>Films et séries favoris</h3>
          <div className="media-grid">
            {profile.favorites.map((media) => (
              <Link
                key={media.id}
                to={`/${media.type === "film" ? "films" : "series"}/${media.slug}`}
                className="media-card"
              >
                {media.posterPath ? (
                  <img
                    src={getMediaPosterUrl(media.slug)}
                    alt={media.title}
                    className="media-card-poster"
                  />
                ) : (
                  <div className="media-card-poster media-card-no-poster">
                    <span>{media.title[0]}</span>
                  </div>
                )}
                <div className="media-card-body">
                  <p className="media-card-title">{media.title}</p>
                  <span className="status-label">{media.type === "film" ? "Film" : "Série"}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.favorites !== null && profile.favorites.length === 0 && (
        <div className="panel">
          <p className="eyebrow">Favoris</p>
          <div className="empty-state">
            <p className="muted">Aucun favori pour le moment.</p>
          </div>
        </div>
      )}
    </section>
  );
}
