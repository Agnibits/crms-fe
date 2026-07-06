"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { toastError } from "@/services/api";

/**
 * Factory producing standard React Query hooks for a CRUD service.
 *
 * const hooks = createCrudHooks({ key: ["customers"], service: customerService, label: "Customer" });
 * hooks.useList(params); hooks.useDetail(id); hooks.useCreate(); …
 */
export function createCrudHooks({ key, service, label = "Record" }) {
  function useList(params = {}, options = {}) {
    return useQuery({
      queryKey: [...key, "list", params],
      queryFn: ({ signal }) => service.list(params, { signal }),
      placeholderData: keepPreviousData,
      ...options,
    });
  }

  function useDetail(id, options = {}) {
    return useQuery({
      queryKey: [...key, "detail", id],
      queryFn: ({ signal }) => service.getById(id, { signal }),
      enabled: !!id,
      ...options,
    });
  }

  function useSub(id, path, options = {}) {
    return useQuery({
      queryKey: [...key, "detail", id, path],
      queryFn: ({ signal }) => service.sub(id, path, {}, { signal }),
      enabled: !!id,
      ...options,
    });
  }

  function useCreate(options = {}) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload) => service.create(payload),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: key });
        toast.success(`${label} created successfully`);
        options.onSuccess?.(data, variables, context);
      },
      onError: (error) => toastError(error, `Failed to create ${label.toLowerCase()}`),
    });
  }

  function useUpdate(options = {}) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, ...payload }) => service.update(id, payload),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: key });
        toast.success(`${label} updated successfully`);
        options.onSuccess?.(data, variables, context);
      },
      onError: (error) => toastError(error, `Failed to update ${label.toLowerCase()}`),
    });
  }

  /** Optimistic partial update (e.g. drag-and-drop stage changes). */
  function usePatch(options = {}) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, ...payload }) => service.patch(id, payload),
      onMutate: async ({ id, ...payload }) => {
        await queryClient.cancelQueries({ queryKey: key });
        const previous = queryClient.getQueriesData({ queryKey: key });
        // Optimistically patch the item inside any cached list.
        queryClient.setQueriesData({ queryKey: key }, (old) => {
          if (!old) return old;
          if (Array.isArray(old.items)) {
            return {
              ...old,
              items: old.items.map((item) => (item.id === id ? { ...item, ...payload } : item)),
            };
          }
          if (old.id === id) return { ...old, ...payload };
          return old;
        });
        return { previous };
      },
      onError: (error, _variables, context) => {
        context?.previous?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
        toastError(error, `Failed to update ${label.toLowerCase()}`);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      ...options,
    });
  }

  function useRemove(options = {}) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => service.remove(id),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: key });
        toast.success(`${label} deleted`);
        options.onSuccess?.(data, variables, context);
      },
      onError: (error) => toastError(error, `Failed to delete ${label.toLowerCase()}`),
    });
  }

  function useBulkRemove(options = {}) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (ids) => service.bulkRemove(ids),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: key });
        toast.success(`${variables.length} ${label.toLowerCase()}(s) deleted`);
        options.onSuccess?.(data, variables, context);
      },
      onError: (error) => toastError(error, "Bulk delete failed"),
    });
  }

  function useAction(options = {}) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, action, payload }) => service.action(id, action, payload),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: key });
        if (options.successMessage !== false) {
          toast.success(options.successMessage || "Done");
        }
        options.onSuccess?.(data, variables, context);
      },
      onError: (error) => toastError(error),
    });
  }

  return { useList, useDetail, useSub, useCreate, useUpdate, usePatch, useRemove, useBulkRemove, useAction };
}
