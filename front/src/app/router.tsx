import { createBrowserRouter } from "react-router-dom";
import { PublicOnlyRoute } from "../auth/PublicOnlyRoute";
import { RequireAuth } from "../auth/RequireAuth";
import { AppLayout } from "../layouts/AppLayout";
import { AdminMediaPage } from "../pages/AdminMediaPage";
import { AdminPage } from "../pages/AdminPage";
import { AdminSuggestionsPage } from "../pages/AdminSuggestionsPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { EpisodePlayerPage } from "../pages/EpisodePlayerPage";
import { FavoritesPage } from "../pages/FavoritesPage";
import { FilmDetailPage } from "../pages/FilmDetailPage";
import { FilmsPage } from "../pages/FilmsPage";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { SerieDetailPage } from "../pages/SerieDetailPage";
import { SeriesPage } from "../pages/SeriesPage";
import { SuggestionsPage } from "../pages/SuggestionsPage";
import { UserProfilePage } from "../pages/UserProfilePage";
import { WatchlistPage } from "../pages/WatchlistPage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <RequireAuth><HomePage /></RequireAuth>,
      },
      {
        path: "profile",
        element: <RequireAuth><ProfilePage /></RequireAuth>,
      },
      {
        path: "films",
        element: <RequireAuth><FilmsPage /></RequireAuth>,
      },
      {
        path: "films/:slug",
        element: <RequireAuth><FilmDetailPage /></RequireAuth>,
      },
      {
        path: "favorites",
        element: <RequireAuth><FavoritesPage /></RequireAuth>,
      },
      {
        path: "watchlist",
        element: <RequireAuth><WatchlistPage /></RequireAuth>,
      },
      {
        path: "history",
        element: <RequireAuth><HistoryPage /></RequireAuth>,
      },
      {
        path: "users/:username",
        element: <RequireAuth><UserProfilePage /></RequireAuth>,
      },
      {
        path: "series",
        element: <RequireAuth><SeriesPage /></RequireAuth>,
      },
      {
        path: "series/:slug",
        element: <RequireAuth><SerieDetailPage /></RequireAuth>,
      },
      {
        path: "series/:slug/episodes/:episodeId",
        element: <RequireAuth><EpisodePlayerPage /></RequireAuth>,
      },
      {
        path: "notifications",
        element: <RequireAuth><NotificationsPage /></RequireAuth>,
      },
      {
        path: "suggestions",
        element: <RequireAuth><SuggestionsPage /></RequireAuth>,
      },
      {
        path: "admin",
        element: <RequireAuth><AdminPage /></RequireAuth>,
      },
      {
        path: "admin/suggestions",
        element: <RequireAuth><AdminSuggestionsPage /></RequireAuth>,
      },
      {
        path: "admin/users",
        element: <RequireAuth><AdminUsersPage /></RequireAuth>,
      },
      {
        path: "admin/media",
        element: <RequireAuth><AdminMediaPage /></RequireAuth>,
      },
      {
        path: "login",
        element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>,
      },
      {
        path: "register",
        element: <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
