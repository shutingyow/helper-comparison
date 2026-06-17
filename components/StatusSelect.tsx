"use client";

import { Select } from "@/components/ui/select";
import { STATUS_LABELS, type CandidateStatus } from "@/lib/types";

const statuses = Object.keys(STATUS_LABELS) as CandidateStatus[];

export function StatusSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: CandidateStatus;
  onChange: (status: CandidateStatus) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as CandidateStatus)}
      disabled={disabled}
      className={className ?? "w-[160px]"}
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </Select>
  );
}
