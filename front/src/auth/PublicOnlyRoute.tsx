import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "./useSession";

type PublicOnlyRouteProps = {
  children: ReactNode;
};

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isBootstrapping } = useSession();

  if (isBootstrapping) {
    return (
      <section className="page-section">
        <div className="panel">
          <p className="eyebrow">Chargement</p>
          <h2>Verification de la session</h2>
          <p className="muted">Le shell restaure la session avant d&apos;afficher la page publique.</p>
        </div>
      </section>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
