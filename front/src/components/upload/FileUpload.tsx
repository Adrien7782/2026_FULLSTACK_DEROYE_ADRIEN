import { useId, useRef, type ChangeEvent } from "react";

type FileUploadProps = {
  label: string;
  accept: string;
  hint: string;
  file: File | null;
  progress: number | null;
  onFileChange: (file: File | null) => void;
};

const CIRCUMFERENCE = 2 * Math.PI * 22;

export function FileUpload({ label, accept, hint, file, progress, onFileChange }: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] ?? null);
  };

  const handleClear = () => {
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isUploading = progress !== null && progress < 100;
  const strokeDash = progress !== null ? CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE : CIRCUMFERENCE;

  return (
    <div className="file-upload">
      <label className="file-upload-label" htmlFor={inputId}>
        {label}
      </label>

      {file ? (
        <div className="file-upload-selected">
          <div className="file-upload-info">
            {isUploading && (
              <svg className="progress-ring" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
                <circle className="progress-ring-track" cx="24" cy="24" r="22" />
                <circle
                  className="progress-ring-fill"
                  cx="24"
                  cy="24"
                  r="22"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDash}
                />
              </svg>
            )}
            {!isUploading && progress === 100 && (
              <span className="file-upload-done" aria-label="Termine">✓</span>
            )}
            <div className="file-upload-meta">
              <span className="file-upload-name">{file.name}</span>
              <span className="file-upload-size">{(file.size / 1024 / 1024).toFixed(1)} Mo</span>
            </div>
          </div>
          {progress === null && (
            <button type="button" className="file-upload-clear" onClick={handleClear} aria-label="Supprimer le fichier">
              ✕
            </button>
          )}
        </div>
      ) : (
        <label htmlFor={inputId} className="file-upload-zone">
          <span className="file-upload-icon" aria-hidden="true">+</span>
          <span>{hint}</span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            className="file-upload-input"
            onChange={handleChange}
          />
        </label>
      )}
    </div>
  );
}
