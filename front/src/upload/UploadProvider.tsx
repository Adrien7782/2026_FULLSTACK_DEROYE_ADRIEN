import { useCallback, useState, type ReactNode } from "react";
import { createMediaWithProgress } from "../lib/api";
import { UploadContext, type UploadJob } from "./uploadContext";

export function UploadProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [catalogVersion, setCatalogVersion] = useState(0);

  const updateJob = useCallback((id: string, patch: Partial<UploadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const startUpload = useCallback(
    (title: string, formData: FormData) => {
      const id = crypto.randomUUID();

      setJobs((prev) => [
        ...prev,
        { id, title, progress: 0, status: "uploading" },
      ]);

      return createMediaWithProgress(formData, (progress) => {
        updateJob(id, { progress });
      })
        .then((result) => {
          updateJob(id, { progress: 100, status: "done" });
          setCatalogVersion((v) => v + 1);
          return result;
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Erreur inconnue";
          updateJob(id, { status: "error", errorMessage: message });
          throw err;
        });
    },
    [updateJob],
  );

  const dismissJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const bumpCatalogVersion = useCallback(() => {
    setCatalogVersion((v) => v + 1);
  }, []);

  return (
    <UploadContext value={{ jobs, catalogVersion, startUpload, dismissJob, bumpCatalogVersion }}>
      {children}
    </UploadContext>
  );
}
