import { useState } from "react";
import { Link } from "react-router-dom";
import { searchUsers, type UserSearchResult } from "../lib/api";

export function UsersSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setIsSearching(true);
    setError("");
    setSearched(true);
    try {
      const res = await searchUsers(q);
      setResults(res.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la recherche.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleSearch();
  };

  return (
    <section className="page-section">
      <div className="panel">
        <p className="eyebrow">Communauté</p>
        <h2>Rechercher des utilisateurs</h2>

        <div style={{ display: "flex", gap: 10, marginTop: 16, marginBottom: 16 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Nom d'utilisateur…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="primary-button"
            onClick={() => void handleSearch()}
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? "Recherche…" : "Rechercher"}
          </button>
        </div>

        {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

        {searched && results.length === 0 && !isSearching && (
          <p className="muted">Aucun utilisateur trouvé pour &ldquo;{query}&rdquo;.</p>
        )}

        {results.length > 0 && (
          <div className="users-list">
            {results.map((user) => (
              <Link key={user.id} to={`/users/${user.username}`} className="user-list-item">
                <div className="user-list-avatar">
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.username} />
                    : <span>{user.username.charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <p className="user-list-username">{user.username}</p>
                  <p className="muted" style={{ fontSize: "0.8rem" }}>
                    Profil {user.isPublic ? "public" : "privé"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
