"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { api, unwrap } from "./api";
import { API_URL } from "@/constants/app";

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
  /** Real multipart upload to the backend's /files/upload endpoint. */
  async upload(file, { relatedType, relatedId } = {}) {
    const form = new FormData();
    form.append("file", file);
    if (relatedType) form.append("relatedType", relatedType);
    if (relatedId) form.append("relatedId", relatedId);
    // Override the instance's default JSON content-type so axios detects the
    // FormData and sets multipart/form-data WITH the required boundary.
    return fromBackend(
      unwrap(await api.post("/files/upload", form, { headers: { "Content-Type": undefined } }))
    );
  },
};
