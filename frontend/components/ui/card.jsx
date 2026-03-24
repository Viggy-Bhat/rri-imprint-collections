export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white border border-neutral-200 rounded-lg shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`px-6 py-4 border-b border-neutral-100 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = "", children, ...props }) {
  return (
    <div className={`px-6 py-4 border-t border-neutral-100 flex gap-3 ${className}`} {...props}>
      {children}
    </div>
  )
}
