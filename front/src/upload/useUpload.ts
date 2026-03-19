import { use } from "react";
import { UploadContext } from "./uploadContext";

export const useUpload = () => {
  const ctx = use(UploadContext);
  if (!ctx) throw new Error("useUpload must be used inside UploadProvider");
  return ctx;
};
