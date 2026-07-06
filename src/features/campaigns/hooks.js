"use client";
import { createCrudHooks } from "@/hooks/useCrud";
import { campaignService } from "@/services/campaign.service";
import { QUERY_KEYS } from "@/constants/app";

export const campaignHooks = createCrudHooks({
  key: QUERY_KEYS.campaigns,
  service: campaignService,
  label: "Campaign",
});
