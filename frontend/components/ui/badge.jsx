import { cn } from "@/lib/utils"

export function Badge({ className = "", children, variant = "default", ...props }) {
  const variants = {
    default: "bg-[#8b1c1c]/10 text-[#8b1c1c] border border-[#8b1c1c]/20",
    secondary: "bg-neutral-200 text-neutral-800 border border-neutral-300",
    outline: "border border-neutral-300 text-neutral-700",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
