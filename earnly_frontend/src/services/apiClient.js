import { supabase } from "./supabaseClient";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token;
}

function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

async function parseError(response) {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") return payload.detail;
    if (payload.detail?.supabase?.message) return payload.detail.supabase.message;
    if (payload.message) return payload.message;
    return JSON.stringify(payload);
  } catch {
    return response.statusText || "Request failed";
  }
}

export async function apiRequest(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("You need to be logged in to continue.");

  const response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) return null;
  return response.json();
}
