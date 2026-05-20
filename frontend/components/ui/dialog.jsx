"use client"

import { useState } from "react"
import { Button } from "./button"

export function Dialog({ open = false, onOpenChange, children, ...props }) {
  const [isOpen, setIsOpen] = useState(open)

  const handleClose = () => {
    setIsOpen(false)
    onOpenChange?.(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={handleClose}
      {...props}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className = "", ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`mb-4 pb-4 border-b border-neutral-200 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = "", ...props }) {
  return (
    <h2 className={`text-2xl font-bold text-[#8b1c1c] ${className}`} {...props}>
      {children}
    </h2>
  )
}

export function DialogFooter({ children, className = "", ...props }) {
  return (
    <div className={`mt-6 pt-4 border-t border-neutral-200 flex justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  )
}
