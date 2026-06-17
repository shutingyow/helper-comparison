import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FILTER_LABELS } from "@/lib/types";
import type { FilterResult } from "@/lib/types";

export function FilterBadges({
  filters,
  filterResults,
  className,
}: {
  filters?: FilterResult[];
  filterResults?: FilterResult[];
  className?: string;
}) {
  const items = filters ?? filterResults ?? [];
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {items.map((f) => (
        <Badge
          key={f.filter}
          variant={f.passed ? "filterPass" : "filterFail"}
          title={f.reason}
        >
          {FILTER_LABELS[f.filter] ?? f.filter}
        </Badge>
      ))}
    </div>
  );
}
