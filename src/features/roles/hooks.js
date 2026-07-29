"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { roleService } from "@/services/role.service";
import { toastError } from "@/services/api";

const MATRIX_KEY = ["roles", "matrix"];

/** The full editable RBAC matrix for the current company. */
export function useRoleMatrix() {
  return useQuery({
    queryKey: MATRIX_KEY,
    queryFn: roleService.getMatrix,
    staleTime: 60_000,
  });
}

/** Persist one role's permission set. */
export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permissions, dataScope }) =>
      roleService.updateRolePermissions(role, { permissions, dataScope }),
    onSuccess: (_data, { label }) => {
      toast.success(`Permissions updated${label ? ` for ${label}` : ""}`);
      qc.invalidateQueries({ queryKey: MATRIX_KEY });
    },
    onError: (e) => toastError(e, "Failed to update permissions"),
  });
}
