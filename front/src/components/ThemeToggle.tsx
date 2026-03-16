import { useTheme } from "../theme/useTheme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" aria-label="Theme selector">
      <button
        type="button"
        className={theme === "light" ? "is-active" : undefined}
        onClick={() => setTheme("light")}
      >
        Light
      </button>
      <button
        type="button"
        className={theme === "dark" ? "is-active" : undefined}
        onClick={() => setTheme("dark")}
      >
        Dark
      </button>
      <button
        type="button"
        className={theme === "system" ? "is-active" : undefined}
        onClick={() => setTheme("system")}
      >
        System
      </button>
    </div>
  );
}
