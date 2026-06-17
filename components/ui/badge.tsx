import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-stone-100 text-stone-700",
        new: "bg-sky-100 text-sky-800",
        shortlisted: "bg-violet-100 text-violet-800",
        messaged: "bg-amber-100 text-amber-900",
        interviewing: "bg-teal-100 text-teal-800",
        rejected: "bg-stone-200 text-stone-600",
        hired: "bg-emerald-100 text-emerald-800",
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
