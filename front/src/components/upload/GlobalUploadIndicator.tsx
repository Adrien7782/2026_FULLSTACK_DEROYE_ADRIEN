import { useUpload } from "../../upload/useUpload";

const CIRCUMFERENCE = 2 * Math.PI * 14;

export function GlobalUploadIndicator() {
  const { jobs, dismissJob } = useUpload();

  const activeJobs = jobs.filter((j) => j.status !== "done" || true);

  if (activeJobs.length === 0) return null;

  return (
    <div className="global-upload-indicator" role="status" aria-live="polite">
      {activeJobs.map((job) => {
        const strokeDash = CIRCUMFERENCE - (job.progress / 100) * CIRCUMFERENCE;

        return (
          <div key={job.id} className={`upload-indicator-job is-${job.status}`}>
            <div className="upload-indicator-ring">
              {job.status === "uploading" && (
                <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                  <circle className="progress-ring-track" cx="16" cy="16" r="14" />
                  <circle
                    className="progress-ring-fill"
                    cx="16"
                    cy="16"
                    r="14"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDash}
                  />
                  <text x="16" y="20" textAnchor="middle" className="progress-ring-text">
                    {job.progress}
                  </text>
                </svg>
              )}
              {job.status === "done" && (
                <span className="upload-indicator-icon is-done" aria-label="Terminé">✓</span>
              )}
              {job.status === "error" && (
                <span className="upload-indicator-icon is-error" aria-label="Erreur">!</span>
              )}
            </div>

            <div className="upload-indicator-info">
              <span className="upload-indicator-title">{job.title}</span>
              <span className="upload-indicator-status">
                {job.status === "uploading" && `${job.progress}% transféré`}
                {job.status === "done" && "Upload terminé"}
                {job.status === "error" && (job.errorMessage ?? "Erreur")}
              </span>
            </div>

            {job.status !== "uploading" && (
              <button
                type="button"
                className="upload-indicator-dismiss"
                onClick={() => dismissJob(job.id)}
                aria-label="Fermer"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
