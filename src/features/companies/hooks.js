"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { superadminService } from "@/services/superadmin.service";
import { toastError } from "@/services/api";

const KEY = ["companies"];

export function useCompanies(params = {}) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: ({ signal }) => superadminService.listCompanies(params, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCompany(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => superadminService.createCompany(payload),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Company created — its admin can log in now");
      options.onSuccess?.(data, vars, ctx);
    },
    onError: (error) => toastError(error, "Failed to create company"),
  });
}

export function useSetCompanyActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }) =>
      active ? superadminService.activateCompany(id) : superadminService.suspendCompany(id),
    onSuccess: (_data, { active }) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(active ? "Company activated" : "Company suspended");
    },
    onError: (error) => toastError(error, "Failed to update company"),
  });
}
