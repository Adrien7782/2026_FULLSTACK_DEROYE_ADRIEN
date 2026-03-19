import type { CatalogGenre } from "../../lib/api";

type CatalogToolbarProps = {
  genres: CatalogGenre[];
  searchValue: string;
  activeGenre: string;
  activeStatus?: "published" | "draft" | "all";
  showStatusFilter?: boolean;
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onStatusChange?: (value: "published" | "draft" | "all") => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function CatalogToolbar({
  genres,
  searchValue,
  activeGenre,
  activeStatus = "published",
  showStatusFilter = false,
  onSearchChange,
  onGenreChange,
  onStatusChange,
  onSubmit,
  onReset,
}: CatalogToolbarProps) {
  return (
    <div className="panel">
      <div className="catalog-toolbar">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h3>Recherche et filtres</h3>
          <p className="muted">
            Recherche un film par titre et affine ensuite par genre.
          </p>
        </div>

        <form
          className="catalog-toolbar-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className="catalog-search">
            <span>Recherche</span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Ex: Interstellar"
            />
          </label>

          <label className="catalog-select">
            <span>Genre</span>
            <select value={activeGenre} onChange={(event) => onGenreChange(event.target.value)}>
              <option value="">Tous les genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.slug}>
                  {genre.name} ({genre.mediaCount})
                </option>
              ))}
            </select>
          </label>

          {showStatusFilter && onStatusChange && (
            <label className="catalog-select">
              <span>Visibilite</span>
              <select
                value={activeStatus}
                onChange={(event) =>
                  onStatusChange(event.target.value as "published" | "draft" | "all")
                }
              >
                <option value="all">Tous</option>
                <option value="published">Publies</option>
                <option value="draft">Brouillons</option>
              </select>
            </label>
          )}

          <div className="catalog-toolbar-actions">
            <button type="submit" className="primary-button">
              Rechercher
            </button>
            <button type="button" className="secondary-button" onClick={onReset}>
              Reinitialiser
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
