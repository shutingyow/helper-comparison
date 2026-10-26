import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-stone-100 text-stone-700",
        /** Pipeline: muted stone; accent tint only for key stages */
        new: "bg-jade-50 text-jade-800 ring-1 ring-inset ring-jade-200/70",
        shortlisted: "bg-jade-100 text-jade-800 ring-1 ring-inset ring-jade-200/80",
        messaged: "bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200/80",
        interview_scheduled: "bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200/80",
        interviewing: "bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200/80",
        rejected: "bg-stone-100 text-stone-500 ring-1 ring-inset ring-stone-200/60",
        hired: "bg-jade-100 text-jade-800 ring-1 ring-inset ring-jade-200/80",
        filterFail: "bg-stone-100 text-stone-500",
        filterPass: "bg-jade-50 text-jade-700",
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
