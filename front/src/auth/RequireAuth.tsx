import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./useSession";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useSession();

  if (isBootstrapping) {
    return (
      <section className="page-section">
        <div className="panel">
          <p className="eyebrow">Authentification</p>
          <h2>Verification de la session</h2>
          <p className="muted">Le shell controle la session active avant d&apos;ouvrir la page.</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
