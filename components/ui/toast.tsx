"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  type?: "success" | "error"
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="animate-in slide-in-from-top-2">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 bg-background",
          type === "success" && "border-green-500 text-green-700",
          type === "error" && "border-red-500 text-red-700",
        )}
      >
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-sm transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
