import { cn } from "@/lib/utils"

export function Button({ className = "", children, variant = "default", size = "md", ...props }) {
  const baseClass = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    default: "bg-[#8b1c1c] text-white hover:bg-[#6b1515]",
    secondary: "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
    outline: "border border-neutral-300 text-neutral-900 hover:bg-neutral-50",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button
      className={cn(baseClass, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
