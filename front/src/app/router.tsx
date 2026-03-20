import { createBrowserRouter } from "react-router-dom";
import { PublicOnlyRoute } from "../auth/PublicOnlyRoute";
import { RequireAuth } from "../auth/RequireAuth";
import { AppLayout } from "../layouts/AppLayout";
import { FavoritesPage } from "../pages/FavoritesPage";
import { FilmDetailPage } from "../pages/FilmDetailPage";
import { FilmsPage } from "../pages/FilmsPage";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
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
