"use client"

import { Link, usePathname, useRouter } from "@/i18n/routing"
import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect } from "react"
import { ShieldAlert, ArrowRightLeft, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import * as LucideIcons from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function TopNavBar({ navItems = [] }: { navItems?: any[] }) {
  const t = useTranslations('Navigation')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  
  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }
  
  const { theme, setTheme } = useTheme()
  
  // --- STATE FOR HYDRATION SYNC ---
  const [mounted, setMounted] = useState(false)

  // --- SYSTEM STATE TEST TOGGLE ---
  type SystemState = "PROD" | "DRC" | "Test: Prod to DRC" | "Test: DRC to Prod" | "Prod to DRC" | "DRC to Prod"
  const STATES: SystemState[] = [
    "PROD", 
    "Test: Prod to DRC", 
    "Prod to DRC", 
    "DRC", 
    "Test: DRC to Prod",
    "DRC to Prod"
  ]
  const [currentState, setCurrentState] = useState<SystemState>("PROD")

  useEffect(() => {
    setMounted(true)
    // --- AUTOMATIC LIVE CYCLE FOR TESTING ---
    const interval = setInterval(() => {
      setCurrentState(prev => {
        const nextIdx = (STATES.indexOf(prev) + 1) % STATES.length
        return STATES[nextIdx]
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    // Skeleton render to perfectly match server output and bypass hydration failures
    return (
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm h-16" />
    )
  }

  const parseTranslation = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr)
      return parsed[locale] || parsed["en"] || jsonStr
    } catch {
      return jsonStr
    }
  }

  const links = navItems.map(item => {
    const IconCmp = (LucideIcons as any)[item.iconName] || LucideIcons.File
    return {
      href: item.path,
      label: parseTranslation(item.label),
      icon: IconCmp
    }
  })

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex h-16 items-center px-4 md:px-6">
        
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 mr-8 transition-transform hover:scale-105">
          <div className="bg-indigo-500/10 p-1.5 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 hidden sm:inline-block tracking-tight">DRC Observer</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex items-center space-x-1 lg:space-x-2">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline-block">{link.label}</span>
              </Link>
            )
          })}
          
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block"></div>
          
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.includes('/admin')
                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            )}
            title="CMS Configuration"
          >
            <LucideIcons.Settings className="w-4 h-4" />
            <span className="hidden md:inline-block">Admin</span>
          </Link>
        </div>

        {/* Right Corner: Data Center Action Status & Settings */}
        <div className="ml-auto flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-full shadow-inner mr-2 transition-colors">
            <button
              onClick={() => switchLocale('en')}
              className={cn("px-2 py-1 text-xs font-bold rounded-full transition-colors", locale === 'en' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}
            >
              EN
            </button>
            <button
              onClick={() => switchLocale('tr')}
              className={cn("px-2 py-1 text-xs font-bold rounded-full transition-colors", locale === 'tr' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}
            >
              TR
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors px-3 py-1.5 rounded-full shadow-inner">
            <span className="uppercase tracking-widest text-[10px]">{t('action')}</span>
            <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />
            
            {currentState === "PROD" || currentState === "DRC" ? (
              <span className={cn(
                "flex items-center gap-1.5",
                currentState === "PROD" ? "text-emerald-400" : "text-amber-400"
              )}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]", 
                  currentState === "PROD" ? "bg-emerald-500" : "bg-amber-500"
                )} />
                {currentState}
              </span>
            ) : (
              <span className={cn(
                "flex items-center gap-1.5 drop-shadow-[0_0_8px_currentColor]",
                currentState.includes("Test") ? "text-indigo-400" : "text-amber-400"
              )}>
                {currentState.includes("Test") && (
                  <span className="text-[10px] uppercase text-indigo-500 bg-indigo-500/10 px-1 rounded-sm mr-1">Test</span>
                )}
                {currentState.replace("Test: ", "").split(' to ')[0]}
                <ArrowRightLeft className={cn(
                  "w-3 h-3 transition-transform duration-500",
                  currentState.includes("DRC to Prod") ? "-rotate-180 text-amber-500/70" : "text-emerald-500/70"
                )} /> 
                {currentState.replace("Test: ", "").split(' to ')[1]}
              </span>
            )}
          </div>
        </div>

      </div>
    </nav>
  )
}
