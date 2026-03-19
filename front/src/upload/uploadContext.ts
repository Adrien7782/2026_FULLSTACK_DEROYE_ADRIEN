import { createContext } from "react";

export type UploadStatus = "uploading" | "done" | "error";

export type UploadJob = {
  id: string;
  title: string;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
};

export type UploadContextValue = {
  jobs: UploadJob[];
  catalogVersion: number;
  startUpload: (title: string, formData: FormData) => Promise<void>;
  dismissJob: (id: string) => void;
};

export const UploadContext = createContext<UploadContextValue | null>(null);
