"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

/** KPI tile with icon, value and growth delta. */
export default function StatCard({ title, value, icon: Icon, delta, hint, loading, index = 0 }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isUp = typeof delta === "number" && delta >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4.5 w-4.5 text-primary" aria-hidden />
              </div>
            )}
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {(delta !== undefined || hint) && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              {typeof delta === "number" && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}
                >
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(delta)}%
                </span>
              )}
              {hint || "vs last month"}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
