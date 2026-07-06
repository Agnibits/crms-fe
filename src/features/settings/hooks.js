"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { toastError } from "@/services/api";
import { settingsService } from "@/services/settings.service";
import { QUERY_KEYS } from "@/constants/app";

const settingKey = (key) => [...QUERY_KEYS.settings, key];

/** Fetch a settings section, e.g. useSetting("company"). */
export function useSetting(key, options = {}) {
  return useQuery({
    queryKey: settingKey(key),
    queryFn: ({ signal }) => settingsService.get(key, { signal }),
    enabled: !!key,
    ...options,
  });
}

/** Save a settings section with a success toast. */
export function useUpdateSetting(key, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => settingsService.update(key, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: settingKey(key) });
      toast.success(options.successMessage || "Settings saved");
      options.onSuccess?.(data, variables, context);
    },
    onError: (error) => toastError(error, "Failed to save settings"),
  });
}

/**
 * Item-level CRUD for array settings sections (branches / departments / teams).
 *   const { query, create, update, remove } = useSettingItems("branches", { label: "Branch" });
 */
export function useSettingItems(key, { label = "Item" } = {}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: settingKey(key) });

  const query = useQuery({
    queryKey: settingKey(key),
    queryFn: ({ signal }) => settingsService.list(key, { signal }),
    enabled: !!key,
  });

  const create = useMutation({
    mutationFn: (payload) => settingsService.create(key, payload),
    onSuccess: () => {
      invalidate();
      toast.success(`${label} added`);
    },
    onError: (error) => toastError(error, `Failed to add ${label.toLowerCase()}`),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }) => settingsService.updateItem(key, id, payload),
    onSuccess: () => {
      invalidate();
      toast.success(`${label} updated`);
    },
    onError: (error) => toastError(error, `Failed to update ${label.toLowerCase()}`),
  });

  const remove = useMutation({
    mutationFn: (id) => settingsService.removeItem(key, id),
    onSuccess: () => {
      invalidate();
      toast.success(`${label} deleted`);
    },
    onError: (error) => toastError(error, `Failed to delete ${label.toLowerCase()}`),
  });

  return { query, create, update, remove };
}
