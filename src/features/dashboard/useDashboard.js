"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { QUERY_KEYS } from "@/constants/app";

const key = QUERY_KEYS.dashboard;

export const useDashboardStats = () =>
  useQuery({
    queryKey: [...key, "stats"],
    queryFn: ({ signal }) => dashboardService.getStats({ signal }),
  });

export const useSalesChart = () =>
  useQuery({
    queryKey: [...key, "sales-chart"],
    queryFn: ({ signal }) => dashboardService.getSalesChart({}, { signal }),
  });

export const useFunnel = () =>
  useQuery({
    queryKey: [...key, "funnel"],
    queryFn: ({ signal }) => dashboardService.getFunnel({ signal }),
  });

export const usePipeline = () =>
  useQuery({
    queryKey: [...key, "pipeline"],
    queryFn: ({ signal }) => dashboardService.getPipeline({ signal }),
  });

export const useRecentActivities = () =>
  useQuery({
    queryKey: [...key, "activities"],
    queryFn: ({ signal }) => dashboardService.getRecentActivities({ signal }),
  });

export const useUpcomingTasks = () =>
  useQuery({
    queryKey: [...key, "tasks"],
    queryFn: ({ signal }) => dashboardService.getUpcomingTasks({ signal }),
  });
