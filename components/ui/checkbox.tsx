import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn("flex cursor-pointer items-center gap-2.5", className)}
    >
      <input
        type="checkbox"
        id={id}
        className="h-4 w-4 rounded border-stone-300 text-coral-600 focus:ring-coral-500"
        {...props}
      />
      {label && <span className="text-sm text-stone-700">{label}</span>}
    </label>
  );
}
