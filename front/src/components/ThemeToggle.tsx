import { useTheme } from "../theme/useTheme";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <div className="theme-toggle" aria-label="Sélecteur de thème">
        <button
          type="button"
          className={theme === "light" ? "is-active" : undefined}
          onClick={() => setTheme("light")}
        >
          Clair
        </button>
        <button
          type="button"
          className={theme === "dark" ? "is-active" : undefined}
          onClick={() => setTheme("dark")}
        >
          Sombre
        </button>
        <button
          type="button"
          className={theme === "system" ? "is-active" : undefined}
          onClick={() => setTheme("system")}
        >
          Système
        </button>
      </div>
      <p className="theme-toggle-caption">
        {theme === "system"
          ? `Le système suit actuellement le mode ${resolvedTheme === "dark" ? "sombre" : "clair"}.`
          : `Mode actif : ${resolvedTheme === "dark" ? "sombre" : "clair"}.`}
      </p>
    </div>
  );
}
