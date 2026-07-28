"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createCrudHooks } from "@/hooks/useCrud";
import { campaignService } from "@/services/campaign.service";
import { toastError } from "@/services/api";
import { QUERY_KEYS } from "@/constants/app";

export const campaignHooks = createCrudHooks({
  key: QUERY_KEYS.campaigns,
  service: campaignService,
  label: "Campaign",
});

/** Live recipient count for the composer's audience selector. */
export function useAudiencePreview(audience) {
  return useQuery({
    queryKey: [...QUERY_KEYS.campaigns, "audience", audience],
    queryFn: () => campaignService.previewAudience(audience),
    enabled: !!audience?.type,
    staleTime: 30_000,
  });
}

/** Send a campaign now — delivery runs server-side in the background. */
export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => campaignService.send(id),
    onSuccess: () => {
      toast.success("Campaign is sending");
      qc.invalidateQueries({ queryKey: QUERY_KEYS.campaigns });
    },
    onError: (e) => toastError(e, "Failed to send campaign"),
  });
}

/** Per-recipient send + open/click rows for a campaign. */
export function useCampaignRecipients(id) {
  return useQuery({
    queryKey: [...QUERY_KEYS.campaigns, id, "recipients"],
    queryFn: () => campaignService.recipients(id),
    enabled: !!id,
  });
}
