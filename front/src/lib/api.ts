const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type HealthResponse = {
  ok: boolean;
  service: string;
  database: string;
  timestamp: string;
};

export function getApiBaseUrl() {
  return API_URL;
}

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch health status");
  }

  return (await response.json()) as HealthResponse;
}
