"use client";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createCrudHooks } from "@/hooks/useCrud";
import { userService } from "@/services/user.service";
import { toastError } from "@/services/api";
import { QUERY_KEYS } from "@/constants/app";

export const userHooks = createCrudHooks({
  key: QUERY_KEYS.users,
  service: userService,
  label: "User",
});

/** Admin-set a member's password (signs them out everywhere). */
export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }) => userService.setPassword(id, password),
    onSuccess: () => toast.success("Password updated — share it with the user"),
    onError: (e) => toastError(e, "Failed to update password"),
  });
}
