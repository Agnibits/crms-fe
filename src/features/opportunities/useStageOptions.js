"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDefaultPipeline } from "@/services/opportunity.service";

const STAGE_COLOR_CYCLE = ["blue", "cyan", "violet", "amber", "orange"];

/**
 * The company's actual pipeline stages → StatusBadge/board/select options.
 * Won stages are green, lost red, the rest cycle through the palette.
 */
export function toStageOptions(pipeline) {
  let i = 0;
  return (pipeline?.stages ?? []).map((s) => ({
    value: s.name,
    label: s.name,
    id: s.id,
    isWon: s.isWon,
    isLost: s.isLost,
    probability: s.probability,
    color: s.isWon ? "green" : s.isLost ? "red" : STAGE_COLOR_CYCLE[i++ % STAGE_COLOR_CYCLE.length],
  }));
}

/** Shared hook: default pipeline + its stage options. */
export function useStageOptions() {
  const { data: pipeline } = useQuery({
    queryKey: ["pipelines", "default"],
    queryFn: getDefaultPipeline,
    staleTime: 5 * 60 * 1000,
  });
  const stageOptions = useMemo(() => toStageOptions(pipeline), [pipeline]);
  return { pipeline, stageOptions };
}
