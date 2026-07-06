"use client";

import { BarChart3, Boxes, DollarSign, Download, ShieldAlert, TrendingUp, Trophy } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import RoleGate from "@/components/common/RoleGate";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import StatCard from "@/components/common/StatCard";
import ChartCard from "@/components/charts/ChartCard";
import SalesAreaChart from "@/components/charts/SalesAreaChart";
import PipelineBarChart from "@/components/charts/PipelineBarChart";
import FunnelBarChart from "@/components/charts/FunnelBarChart";
import DonutChart from "@/components/charts/DonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReport } from "@/features/reports/hooks";
import { exportToCsv, exportToExcel, exportToPdf } from "@/utils/export";
import { formatCurrency, formatNumber, titleCase } from "@/utils/format";
import { cn } from "@/utils/cn";

/* ── Export dropdown shared by every tab ──────────────────────── */
function ExportMenu({ filename, title, columns, rows = [], disabled }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || rows.length === 0}>
          <Download /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => exportToCsv(rows, `${filename}.csv`, columns)}>
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel(rows, `${filename}.xls`, columns)}>
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToPdf({ title, columns, rows, filename: `${filename}.pdf` })}
        >
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TabToolbar({ children }) {
  return <div className="flex items-center justify-end">{children}</div>;
}

/* ── Revenue ──────────────────────────────────────────────────── */
function RevenueTab() {
  const { data, isPending, error, refetch } = useReport("revenue");
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const series = data?.series ?? [];
  const best = series.reduce((acc, m) => (m.revenue > (acc?.revenue ?? -1) ? m : acc), null);
  const avg = series.length
    ? Math.round(series.reduce((a, m) => a + m.revenue, 0) / series.length)
    : 0;

  const exportRows = series.map((m) => ({
    month: m.month,
    revenue: m.revenue,
    target: m.target,
    deals: m.deals,
  }));

  return (
    <div className="space-y-4">
      <TabToolbar>
        <ExportMenu
          filename="revenue-report"
          title="Revenue Report"
          disabled={isPending}
          rows={exportRows}
          columns={[
            { key: "month", label: "Month" },
            { key: "revenue", label: "Revenue" },
            { key: "target", label: "Target" },
            { key: "deals", label: "Deals" },
          ]}
        />
      </TabToolbar>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data?.total)}
          icon={DollarSign}
          hint="All collected payments"
          loading={isPending}
          index={0}
        />
        <StatCard
          title="Avg. Monthly Revenue"
          value={formatCurrency(avg)}
          icon={TrendingUp}
          hint="Across the last 12 months"
          loading={isPending}
          index={1}
        />
        <StatCard
          title="Best Month"
          value={best ? `${best.month} · ${formatCurrency(best.revenue)}` : "—"}
          icon={BarChart3}
          hint="Highest revenue month"
          loading={isPending}
          index={2}
        />
      </div>
      <ChartCard
        title="Revenue Trend"
        description="Monthly revenue vs target"
        loading={isPending}
        height={340}
      >
        <SalesAreaChart data={series} />
      </ChartCard>
    </div>
  );
}

/* ── Customers ────────────────────────────────────────────────── */
function CustomersTab() {
  const { data, isPending, error, refetch } = useReport("customers");
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const byStatus = data?.byStatus ?? [];
  const byIndustry = data?.byIndustry ?? [];

  const exportRows = [
    ...byStatus.map((r) => ({ group: "Status", name: titleCase(r.status), count: r.count })),
    ...byIndustry.map((r) => ({ group: "Industry", name: r.industry, count: r.count })),
  ];

  return (
    <div className="space-y-4">
      <TabToolbar>
        <ExportMenu
          filename="customers-report"
          title="Customers Report"
          disabled={isPending}
          rows={exportRows}
          columns={[
            { key: "group", label: "Breakdown" },
            { key: "name", label: "Segment" },
            { key: "count", label: "Customers" },
          ]}
        />
      </TabToolbar>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Customers by Status"
          description="Active, prospect, inactive and churned"
          loading={isPending}
          height={300}
        >
          <DonutChart
            data={byStatus.map((r) => ({ name: titleCase(r.status), value: r.count }))}
            centerLabel={{
              value: formatNumber(byStatus.reduce((a, r) => a + r.count, 0)),
              label: "customers",
            }}
          />
        </ChartCard>
        <ChartCard
          title="Customers by Industry"
          description="Distribution across industries"
          loading={isPending}
          height={300}
        >
          <DonutChart data={byIndustry.map((r) => ({ name: r.industry, value: r.count }))} />
        </ChartCard>
      </div>
    </div>
  );
}

/* ── Leads ────────────────────────────────────────────────────── */
function LeadsTab() {
  const { data, isPending, error, refetch } = useReport("leads");
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const bySource = data?.bySource ?? [];
  const byStage = data?.byStage ?? [];

  const exportRows = [
    ...bySource.map((r) => ({ group: "Source", name: titleCase(r.source), count: r.count })),
    ...byStage.map((r) => ({ group: "Stage", name: titleCase(r.stage), count: r.count })),
  ];

  return (
    <div className="space-y-4">
      <TabToolbar>
        <ExportMenu
          filename="leads-report"
          title="Leads Report"
          disabled={isPending}
          rows={exportRows}
          columns={[
            { key: "group", label: "Breakdown" },
            { key: "name", label: "Segment" },
            { key: "count", label: "Leads" },
          ]}
        />
      </TabToolbar>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Leads by Source"
          description="Where your leads come from"
          loading={isPending}
          height={300}
        >
          <DonutChart
            data={bySource.map((r) => ({ name: titleCase(r.source), value: r.count }))}
            centerLabel={{
              value: formatNumber(bySource.reduce((a, r) => a + r.count, 0)),
              label: "leads",
            }}
          />
        </ChartCard>
        <ChartCard
          title="Leads by Stage"
          description="Progression through the lead funnel"
          loading={isPending}
          height={300}
        >
          <FunnelBarChart
            data={byStage.map((r) => ({ stage: titleCase(r.stage), count: r.count }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}

/* ── Sales ────────────────────────────────────────────────────── */
function SalesTab() {
  const { data, isPending, error, refetch } = useReport("sales");
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const pipeline = data?.pipeline ?? [];
  const funnel = data?.funnel ?? [];
  const monthly = data?.monthly ?? [];

  const exportRows = [
    ...pipeline.map((r) => ({ section: "Pipeline", label: r.stage, count: r.count, value: r.value })),
    ...funnel.map((r) => ({ section: "Funnel", label: r.stage, count: r.count, value: "" })),
    ...monthly.map((r) => ({ section: "Monthly", label: r.month, count: r.deals, value: r.revenue })),
  ];

  return (
    <div className="space-y-4">
      <TabToolbar>
        <ExportMenu
          filename="sales-report"
          title="Sales Report"
          disabled={isPending}
          rows={exportRows}
          columns={[
            { key: "section", label: "Section" },
            { key: "label", label: "Stage / Month" },
            { key: "count", label: "Count" },
            { key: "value", label: "Value" },
          ]}
        />
      </TabToolbar>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Pipeline by Stage"
          description="Open deal value per stage"
          loading={isPending}
          height={300}
        >
          <PipelineBarChart data={pipeline} />
        </ChartCard>
        <ChartCard
          title="Sales Funnel"
          description="Lead progression through stages"
          loading={isPending}
          height={300}
        >
          <FunnelBarChart data={funnel} />
        </ChartCard>
      </div>
      <ChartCard
        title="Monthly Sales"
        description="Revenue vs target over the last 12 months"
        loading={isPending}
        height={320}
      >
        <SalesAreaChart data={monthly} />
      </ChartCard>
    </div>
  );
}

/* ── Products ─────────────────────────────────────────────────── */
function ProductsTab() {
  const { data, isPending, error, refetch } = useReport("products");
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const top = [...(data?.top ?? [])].sort((a, b) => b.revenue - a.revenue);
  const max = top[0]?.revenue || 1;

  const exportRows = top.map((p) => ({ name: p.name, revenue: p.revenue, stock: p.stock }));

  return (
    <div className="space-y-4">
      <TabToolbar>
        <ExportMenu
          filename="products-report"
          title="Top Products Report"
          disabled={isPending}
          rows={exportRows}
          columns={[
            { key: "name", label: "Product" },
            { key: "revenue", label: "Revenue" },
            { key: "stock", label: "Stock" },
          ]}
        />
      </TabToolbar>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : top.length === 0 ? (
            <EmptyState icon={Boxes} title="No product data" className="border-0 py-10" />
          ) : (
            top.map((product, i) => (
              <div key={product.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                    {product.name}
                  </p>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="secondary" className="tabular-nums">
                      {formatNumber(product.stock)} in stock
                    </Badge>
                    <p className="w-24 text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
                <Progress value={(product.revenue / max) * 100} className="h-1.5" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Employees ────────────────────────────────────────────────── */
const RANK_STYLES = {
  1: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  2: "bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30",
  3: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
};

function EmployeesTab() {
  const { data, isPending, error, refetch } = useReport("employees");
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const performance = [...(data?.performance ?? [])].sort((a, b) => b.revenue - a.revenue);
  const exportRows = performance.map((e, i) => ({
    rank: i + 1,
    name: e.name,
    deals: e.deals,
    revenue: e.revenue,
  }));

  return (
    <div className="space-y-4">
      <TabToolbar>
        <ExportMenu
          filename="employees-report"
          title="Employee Performance Report"
          disabled={isPending}
          rows={exportRows}
          columns={[
            { key: "rank", label: "Rank" },
            { key: "name", label: "Employee" },
            { key: "deals", label: "Deals" },
            { key: "revenue", label: "Revenue Won" },
          ]}
        />
      </TabToolbar>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Sales Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : performance.length === 0 ? (
            <EmptyState icon={Trophy} title="No performance data" className="border-0 py-10" />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">Revenue Won</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((employee, i) => {
                    const rank = i + 1;
                    return (
                      <TableRow key={employee.name}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-6 w-8 justify-center border tabular-nums",
                              RANK_STYLES[rank] || "bg-muted text-muted-foreground border-transparent"
                            )}
                          >
                            {rank <= 3 ? `#${rank}` : rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(employee.deals)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(employee.revenue)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
const TABS = [
  { value: "revenue", label: "Revenue", content: <RevenueTab /> },
  { value: "customers", label: "Customers", content: <CustomersTab /> },
  { value: "leads", label: "Leads", content: <LeadsTab /> },
  { value: "sales", label: "Sales", content: <SalesTab /> },
  { value: "products", label: "Products", content: <ProductsTab /> },
  { value: "employees", label: "Employees", content: <EmployeesTab /> },
];

export default function ReportsPage() {
  return (
    <RoleGate
      roles={["admin", "manager"]}
      fallback={
        <EmptyState
          icon={ShieldAlert}
          title="Access denied"
          description="You don't have permission to view reports. Contact an administrator if you believe this is a mistake."
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Analytics across revenue, customers, leads, sales, products and your team."
        />
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="h-auto flex-wrap justify-start">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </RoleGate>
  );
}
