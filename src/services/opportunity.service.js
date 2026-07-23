"use client";
import { api, unwrap } from "./api";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { withMapping } from "./crudMap";
/**
 * Opportunity CRUD service.
 *
 * The backend requires `pipelineId` + `stageId` (UUIDs) on create/filter,
 * while the UI uses a free-text `stage` name. We resolve the default pipeline
 * once and map the stage name → stageId for every list + write operation.
 */
const base = createCrudService(ENDPOINTS.opportunities);
let _pipeline;
async function defaultPipeline() {
  if (!_pipeline) _pipeline = unwrap(await api.get("/pipelines/default"));
  return _pipeline;
}
function fromBackend(o) {
  if (!o || typeof o !== "object") return o;
  return {
    ...o,
    // Backend returns stage as a relation object { id, name, order, probability }
    stage: o.stage?.name ?? o.stageName ?? o.stage,
    expectedCloseDate: o.closeDate ?? o.expectedCloseDate,
    customerName: o.customer?.name ?? o.customerName,
    ownerId: o.ownerId ?? o.owner?.id,
  };
}
async function toBackend(v = {}) {
  const pipe = await defaultPipeline();
  const stages = pipe?.stages || [];
  const match =
    stages.find(
      (s) => String(s.name).toLowerCase() === String(v.stage || "").toLowerCase()
    ) || stages[0];
  const out = {
    name: v.name,
    amount: v.amount,
    probability: v.probability,
    closeDate: v.expectedCloseDate || undefined,
    customerId: v.customerId || undefined,
    ownerId: v.ownerId || undefined,
    notes: v.notes || undefined,
    pipelineId: pipe?.id,
    stageId: match?.id,
  };
  Object.keys(out).forEach((k) => (out[k] === undefined || out[k] === "") && delete out[k]);
  return out;
}
const mapped = withMapping(base, { fromBackend });
export const opportunityService = {
  ...mapped,
  /**
   * Override list() so the stage name from the dropdown (e.g. "Negotiation")
   * is resolved to the backend stageId UUID before the request is sent.
   * The real DB has no flat `stage` column — filtering must use `filter[stageId]`.
   *
   * Falls back gracefully when the pipeline fetch fails (e.g. in mock mode
   * the /pipelines/default route returns 404 — the raw stage param is kept as-is
   * so mockAdapter's bracket-notation filter handles it).
   */
  async list(params = {}, opts = {}) {
    const nextParams = { ...params };
    const stageName = nextParams.stage;
    if (stageName && stageName !== "all") {
      try {
        const pipe = await defaultPipeline();
        const stages = pipe?.stages || [];
        const match = stages.find(
          (s) => String(s.name).toLowerCase() === String(stageName).toLowerCase()
        );
        if (match?.id) {
          nextParams.stageId = match.id;
          delete nextParams.stage;
        }
        // No match found → keep stage as-is (mock adapter handles it)
      } catch {
        // Pipeline fetch failed → keep stage param as-is
      }
    }
    const res = await base.list(nextParams, opts);
    return { ...res, items: (res.items || []).map(fromBackend) };
  },
  create: async (payload) => base.create(await toBackend(payload)),
  update: async (id, payload) => base.update(id, await toBackend(payload)),
};