"use client"

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Activity } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function getProgressColor(progress: number) {
  if (progress <= 30) return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"
  if (progress <= 50) return "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
  if (progress <= 80) return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
  if (progress < 100) return "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
  return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
}

function getTextColor(progress: number) {
  if (progress <= 30) return "text-yellow-400"
  if (progress <= 50) return "text-orange-400"
  if (progress <= 80) return "text-blue-400"
  if (progress < 100) return "text-indigo-400"
  return "text-emerald-400"
}

export function LiveSyncFooter() {
  const t = useTranslations('Footer')
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // --- LIVE SYNC TEST MODE ---
    setMounted(true)

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 5
        if (next > 120) return 0 // Reset after waiting briefly at the end
        return next
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    // Skeleton placeholder strictly bypassing Server / Client mismatch
    return (
      <div className="fixed bottom-0 w-full h-10 bg-slate-900 border-t border-slate-800 z-50 pointer-events-none" />
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-slate-900 border-t border-slate-800 z-50 flex items-center px-4 md:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 w-48 shrink-0">
        <Activity className={cn(
          "w-4 h-4", 
          Math.min(progress, 100) === 100 ? "animate-none" : "animate-pulse",
          getTextColor(Math.min(progress, 100))
        )} />
        <span className="text-xs font-bold text-slate-300 tracking-wider w-auto whitespace-nowrap overflow-visible">
          {t('global_sync')}
        </span>
      </div>
      
      <div className="flex-1 mx-4 relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 linear",
            getProgressColor(Math.min(progress, 100))
          )} 
          style={{ width: `${Math.min(progress, 100)}%` }} 
        />
      </div>

      <div className="w-12 text-right shrink-0">
        <span className={cn(
          "text-sm font-mono font-bold",
          getTextColor(Math.min(progress, 100))
        )}>
          {Math.min(progress, 100)}%
        </span>
      </div>
    </div>
  )
}
