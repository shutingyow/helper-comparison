import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-stone-100 text-stone-700",
        /** Pipeline: New → Shortlisted → Messaged → Interview → Hired */
        new: "bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-200/80",
        shortlisted: "bg-teal-100 text-teal-900 ring-1 ring-inset ring-teal-200/80",
        messaged: "bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-200/80",
        interview_scheduled: "bg-coral-100 text-coral-800 ring-1 ring-inset ring-coral-100",
        interviewing: "bg-cyan-100 text-cyan-900 ring-1 ring-inset ring-cyan-200/80",
        rejected: "bg-stone-200 text-stone-600 ring-1 ring-inset ring-stone-300/60",
        hired: "bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-200/80",
        filterFail: "bg-rose-100 text-rose-800",
        filterPass: "bg-emerald-50 text-emerald-700",
        outline: "border border-stone-200 bg-white text-stone-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
