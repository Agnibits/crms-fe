"use client";

import { api, unwrap } from "./api";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { withMapping } from "./crudMap";

/**
 * Opportunity CRUD service.
 *
 * The backend requires `pipelineId` + `stageId` (UUIDs) on create, while the
 * mock form uses a free-text `stage` name and `expectedCloseDate`. We resolve
 * the default pipeline once and map the stage name → stageId.
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
    stage: o.stage?.name ?? o.stageName ?? o.stage,
    expectedCloseDate: o.closeDate ?? o.expectedCloseDate,
    customerName: o.customer?.name ?? o.customerName,
  };
}

async function toBackend(v = {}) {
  const pipe = await defaultPipeline();
  const stages = pipe?.stages || [];
  const match =
    stages.find((s) => String(s.name).toLowerCase() === String(v.stage || "").toLowerCase()) ||
    stages[0];
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
  create: async (payload) => base.create(await toBackend(payload)),
  update: async (id, payload) => base.update(id, await toBackend(payload)),
};
