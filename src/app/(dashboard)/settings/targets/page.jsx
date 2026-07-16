"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Save, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ErrorState from "@/components/common/ErrorState";
import { useSalesTargets } from "@/features/settings/useSalesTargets";
import { formatCurrency } from "@/utils/format";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
const MONTHS = Array.from({ length: 12 }, (_, i) => i);

const monthKey = (year, i) => `${year}-${String(i + 1).padStart(2, "0")}`;
const monthName = (year, i) =>
  new Date(year, i, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

function MonthRow({ year, index, override, defaultTarget, onSave, onReset, saving, resetting }) {
  const key = monthKey(year, index);
  const isOverride = override != null;
  const [value, setValue] = useState(isOverride ? String(override) : "");

  const effective = isOverride ? Number(override) : defaultTarget;
  const dirty = value !== "" && Number(value) !== Number(override ?? NaN);

  return (
    <TableRow>
      <TableCell className="font-medium">{monthName(year, index)}</TableCell>
      <TableCell>
        {isOverride ? (
          <Badge variant="secondary">Custom</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Default</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(effective)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Input
            type="number"
            min={0}
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={String(defaultTarget || 0)}
            className="h-8 w-32"
            aria-label={`Target for ${monthName(year, index)}`}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => onSave(key, Number(value))}
          >
            Save
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!isOverride || resetting}
            onClick={() => {
              onReset(key);
              setValue("");
            }}
            aria-label={`Reset ${monthName(year, index)} to default`}
            title="Reset to default"
          >
            <RotateCcw />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function SalesTargetsPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const { query, setDefault, setMonth, resetMonth } = useSalesTargets(year);
  const [defaultValue, setDefaultValue] = useState("");

  const data = query.data;
  const overrides = useMemo(() => {
    const map = new Map();
    for (const item of data?.items || []) map.set(item.month, Number(item.amount));
    return map;
  }, [data]);

  const defaultTarget = Number(data?.defaultTarget ?? 0);
  const defaultDirty = defaultValue !== "" && Number(defaultValue) !== defaultTarget;

  return (
    <div className="space-y-6">
      {/* Default target */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Sales Targets
            </CardTitle>
            <CardDescription className="mt-1">
              Targets drive the “Revenue vs target” line on your dashboard.
            </CardDescription>
          </div>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {query.error ? (
            <ErrorState error={query.error} onRetry={query.refetch} />
          ) : query.isPending ? (
            <Skeleton className="h-10 w-full max-w-sm" />
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="default-target">Default monthly target</Label>
                <Input
                  id="default-target"
                  type="number"
                  min={0}
                  step="any"
                  value={defaultValue === "" ? String(defaultTarget) : defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-48"
                />
              </div>
              <Button
                onClick={() => setDefault.mutate(Number(defaultValue), { onSuccess: () => setDefaultValue("") })}
                loading={setDefault.isPending}
                disabled={!defaultDirty}
              >
                <Save className="h-4 w-4" /> Save default
              </Button>
              <p className="ml-auto text-sm text-muted-foreground">
                Applied to every month without a custom target.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-month overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly overrides — {year}</CardTitle>
          <CardDescription>
            Set a specific target for a month, or reset it to fall back to the default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {query.error ? null : query.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Month</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Effective target</TableHead>
                    <TableHead className="text-right">Set custom</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MONTHS.map((i) => (
                    <MonthRow
                      key={monthKey(year, i)}
                      year={year}
                      index={i}
                      override={overrides.get(monthKey(year, i))}
                      defaultTarget={defaultTarget}
                      onSave={(month, amount) => setMonth.mutate({ month, amount })}
                      onReset={(month) => resetMonth.mutate(month)}
                      saving={setMonth.isPending}
                      resetting={resetMonth.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
