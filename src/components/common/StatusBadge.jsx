import { Badge } from "@/components/ui/badge";
import { BADGE_COLORS, findOption } from "@/constants/options";
import { titleCase } from "@/utils/format";
import { cn } from "@/utils/cn";

/**
 * Colored status badge driven by an options list from constants/options.
 *   <StatusBadge value={row.status} options={INVOICE_STATUSES} />
 */
export default function StatusBadge({ value, options = [], className }) {
  const option = findOption(options, value);
  const color = BADGE_COLORS[option?.color] || BADGE_COLORS.gray;
  return (
    <Badge variant="outline" className={cn("border", color, className)}>
      {option?.label || titleCase(String(value ?? "—"))}
    </Badge>
  );
}
