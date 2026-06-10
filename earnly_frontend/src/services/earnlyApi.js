import { apiRequest } from "./apiClient";

export function getMe() {
  return apiRequest("/me");
}

export function updateProfile(payload) {
  return apiRequest("/me", { method: "PATCH", body: payload });
}

export function completeSetup(payload) {
  return apiRequest("/setup", { method: "POST", body: payload });
}

export function createJob(payload) {
  return apiRequest("/jobs", { method: "POST", body: payload });
}

export function updateJob(jobId, payload) {
  return apiRequest(`/jobs/${jobId}`, { method: "PATCH", body: payload });
}

export function deleteJob(jobId) {
  return apiRequest(`/jobs/${jobId}`, { method: "DELETE" });
}

export function getWeek(jobId, weekStartDate) {
  return apiRequest(`/jobs/${jobId}/weeks/${weekStartDate}`);
}

export function clearWeek(jobId, weekStartDate) {
  return apiRequest(`/jobs/${jobId}/weeks/${weekStartDate}`, { method: "DELETE" });
}

export function upsertEntry(jobId, workDate, payload) {
  return apiRequest(`/jobs/${jobId}/entries/${workDate}`, { method: "PATCH", body: payload });
}
