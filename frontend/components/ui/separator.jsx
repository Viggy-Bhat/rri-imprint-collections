export function Separator({ className = "", horizontal = true, ...props }) {
  return (
    <div
      className={`bg-neutral-200 ${horizontal ? "h-px w-full" : "w-px h-full"} ${className}`}
      {...props}
    />
  )
}
