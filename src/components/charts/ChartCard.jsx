"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/common/ErrorBoundary";

/** Shell for all dashboard/report charts: title, actions, loading state. */
export default function ChartCard({ title, description, actions, loading, height = 300, children }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton style={{ height }} className="w-full" />
        ) : (
          <ErrorBoundary fallbackTitle={`${title} failed to render`}>
            <div style={{ height }} className="w-full">
              {children}
            </div>
          </ErrorBoundary>
        )}
      </CardContent>
    </Card>
  );
}
