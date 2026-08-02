"use client";

import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/services/api";
import { ENDPOINTS } from "@/constants/endpoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

const UNASSIGNED = "__unassigned__";

/** Beyond this the grid stops being scannable, so the rest is summarised. */
const TOP_BRANCHES = 6;

function useTicketBreakdown() {
  return useQuery({
    queryKey: ["tickets", "breakdown"],
    queryFn: async ({ signal }) =>
      unwrap(await api.get(`${ENDPOINTS.tickets}/breakdown`, { signal })),
    staleTime: 30_000,
  });
}

/**
 * Open tickets as a branch × department grid — where the backlog actually sits,
 * before you open any single ticket. Clicking a number applies the matching
 * filters to the list below, so the grid is a way in rather than a dead-end.
 *
 * Rows/columns only appear when something is in them, so a company that doesn't
 * use departments (or branches) never sees an empty axis.
 */
export default function TicketBreakdown({ onSelect }) {
  const { data, isPending, error } = useTicketBreakdown();
  if (error) return null; // A summary is never worth an error banner of its own.

  if (isPending) return <Skeleton className="h-40 w-full rounded-xl" />;

  const cells = data?.cells ?? [];
  if (!cells.length) return null;

  const key = (b, d) => `${b ?? UNASSIGNED}|${d ?? UNASSIGNED}`;
  const counts = new Map(cells.map((c) => [key(c.branchId, c.departmentId), c.count]));

  // Only show axes that carry tickets — an office with nothing open is noise here.
  const usedBranch = new Set(cells.map((c) => c.branchId ?? UNASSIGNED));
  const usedDept = new Set(cells.map((c) => c.departmentId ?? UNASSIGNED));

  const departments = [
    ...(data.departments ?? []).filter((d) => usedDept.has(d.id)),
    ...(usedDept.has(UNASSIGNED) ? [{ id: null, name: "Unrouted" }] : []),
  ];

  const withBacklog = (data.branches ?? []).filter((b) => usedBranch.has(b.id));
  const total = (b) => departments.reduce((n, d) => n + (counts.get(key(b, d.id)) || 0), 0);

  // With dozens of offices nobody reads a 50-row grid — they want the worst
  // few. Rank by backlog and keep the tail as one honest summary line.
  const ranked = withBacklog.map((b) => ({ ...b, total: total(b.id) }))
    .sort((a, b) => b.total - a.total);
  const shown = ranked.slice(0, TOP_BRANCHES);
  const hidden = ranked.slice(TOP_BRANCHES);
  const hiddenTotal = hidden.reduce((n, b) => n + b.total, 0);

  const branches = [
    ...shown,
    // "No branch" is a data-hygiene bucket, not an office — always last, never
    // competing for a place in the ranking.
    ...(usedBranch.has(UNASSIGNED) ? [{ id: null, name: "No branch" }] : []),
  ];
  if (branches.length <= 1 && departments.length <= 1) return null;

  const rowTotal = (b) => total(b.id);
  const colTotal = (d) =>
    [...withBacklog.map((b) => b.id), ...(usedBranch.has(UNASSIGNED) ? [null] : [])]
      .reduce((n, id) => n + (counts.get(key(id, d.id)) || 0), 0);
  const grand = cells.reduce((n, c) => n + c.count, 0);

  const Cell = ({ value, branchId, departmentId, bold }) => {
    if (!value) return <span className="text-muted-foreground">—</span>;
    if (!onSelect) return <span className={cn("tabular-nums", bold && "font-medium")}>{value}</span>;
    return (
      <button
        type="button"
        onClick={() => onSelect({ branchId, departmentId })}
        className={cn(
          "rounded px-1.5 py-0.5 tabular-nums hover:bg-muted hover:underline",
          bold && "font-medium"
        )}
      >
        {formatNumber(value)}
      </button>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Open tickets by branch and department</CardTitle>
        <CardDescription>
          {hidden.length > 0
            ? `The ${shown.length} offices with the largest backlog. Click a number to filter the list below.`
            : "Where the backlog sits. Click a number to filter the list below."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Branch</TableHead>
                {departments.map((d) => (
                  <TableHead key={d.id ?? UNASSIGNED} className="text-right">
                    {d.name}
                  </TableHead>
                ))}
                <TableHead className="text-right font-medium">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id ?? UNASSIGNED}>
                  <TableCell className={cn("font-medium", !b.id && "text-muted-foreground")}>
                    {b.name}
                  </TableCell>
                  {departments.map((d) => (
                    <TableCell key={d.id ?? UNASSIGNED} className="text-right">
                      <Cell
                        value={counts.get(key(b.id, d.id)) || 0}
                        branchId={b.id}
                        departmentId={d.id}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Cell value={rowTotal(b)} branchId={b.id} bold />
                  </TableCell>
                </TableRow>
              ))}
              {hidden.length > 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={departments.length + 1} className="text-muted-foreground">
                    + {formatNumber(hidden.length)} more offices with a smaller backlog
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatNumber(hiddenTotal)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="border-t-2 hover:bg-transparent">
                <TableCell className="font-medium">All branches</TableCell>
                {departments.map((d) => (
                  <TableCell key={d.id ?? UNASSIGNED} className="text-right">
                    <Cell value={colTotal(d)} departmentId={d.id} bold />
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium tabular-nums">
                  {formatNumber(grand)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
