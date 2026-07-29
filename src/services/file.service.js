"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { API_URL } from "@/constants/app";
import { tokenStorage } from "@/utils/storage";

// Uploaded files are served statically from the API origin (no /api/v1 prefix).
const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, "");

/** Map the backend FileAsset shape to what the File Manager UI expects. */
function fromBackend(f) {
  if (!f || typeof f !== "object") return f;
  const name = f.originalName ?? f.name ?? f.fileName ?? "file";
  const type = name.includes(".")
    ? name.split(".").pop().toLowerCase()
    : (f.mimeType?.split("/").pop() ?? "file");
  const uploader =
    f.uploadedBy && typeof f.uploadedBy === "object"
      ? [f.uploadedBy.firstName, f.uploadedBy.lastName].filter(Boolean).join(" ")
      : f.uploadedBy;
  const url = f.url ? (f.url.startsWith("http") ? f.url : `${API_ORIGIN}${f.url}`) : undefined;
  return { ...f, name, type, size: Number(f.size) || 0, uploadedBy: uploader || "—", url };
}

const base = createCrudService(ENDPOINTS.files);

export const fileService = {
  ...base,
  async list(params, opts) {
    const res = await base.list(params, opts);
    return { ...res, items: (res.items || []).map(fromBackend) };
  },
  async getById(id, opts) {
    return fromBackend(await base.getById(id, opts));
  },
  /**
   * Upload via the browser's native fetch so the multipart/form-data boundary is
   * set automatically. (The shared axios instance defaults Content-Type to
   * application/json, which corrupts FormData uploads.)
   */
  async upload(file, { relatedType, relatedId } = {}) {
    const form = new FormData();
    form.append("file", file);
    if (relatedType) form.append("relatedType", relatedType);
    if (relatedId) form.append("relatedId", relatedId);
    const res = await fetch(`${API_URL}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenStorage.getAccessToken() || ""}` },
      body: form,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.message || `Upload failed (${res.status})`);
    return fromBackend(body?.data ?? body);
  },
};
