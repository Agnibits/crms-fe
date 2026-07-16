"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { toastError } from "@/services/api";
import { salesTargetService } from "@/services/salesTarget.service";
import { QUERY_KEYS } from "@/constants/app";

const key = (year) => [...QUERY_KEYS.settings, "sales-targets", year];

export function useSalesTargets(year) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: key(year) });
    // The dashboard chart reads targets too — keep it in sync.
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
  };

  const query = useQuery({
    queryKey: key(year),
    queryFn: ({ signal }) => salesTargetService.get(year, { signal }),
    enabled: !!year,
  });

  const setDefault = useMutation({
    mutationFn: (amount) => salesTargetService.setDefault(amount),
    onSuccess: () => {
      invalidate();
      toast.success("Default target saved");
    },
    onError: (error) => toastError(error, "Failed to save default target"),
  });

  const setMonth = useMutation({
    mutationFn: ({ month, amount }) => salesTargetService.setMonth(month, amount),
    onSuccess: () => {
      invalidate();
      toast.success("Month target saved");
    },
    onError: (error) => toastError(error, "Failed to save month target"),
  });

  const resetMonth = useMutation({
    mutationFn: (month) => salesTargetService.resetMonth(month),
    onSuccess: () => {
      invalidate();
      toast.success("Reset to default");
    },
    onError: (error) => toastError(error, "Failed to reset month"),
  });

  return { query, setDefault, setMonth, resetMonth };
}
