import { createBrowserRouter } from "react-router-dom";
import { PublicOnlyRoute } from "../auth/PublicOnlyRoute";
import { RequireAuth } from "../auth/RequireAuth";
import { AppLayout } from "../layouts/AppLayout";
import { FilmDetailPage } from "../pages/FilmDetailPage";
import { FilmsPage } from "../pages/FilmsPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        ),
      },
      {
        path: "profile",
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: "films",
        element: (
          <RequireAuth>
            <FilmsPage />
          </RequireAuth>
        ),
      },
      {
        path: "films/:slug",
        element: (
          <RequireAuth>
            <FilmDetailPage />
          </RequireAuth>
        ),
      },
      {
        path: "login",
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: "register",
        element: (
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
