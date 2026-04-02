"use client"

import React from "react"
import { WidgetRegistry } from "./WidgetRegistry"
import { useLocale } from "next-intl"
import { Responsive, WidthProvider } from "react-grid-layout/legacy"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { GripHorizontal } from "lucide-react"
import { updateWidgetGridPosition } from "@/app/actions/cms"

const ResponsiveGridLayout = WidthProvider(Responsive)

export function DynamicPageRenderer({ pageData }: { pageData: any }) {
  const locale = useLocale()

  // Safely parse JSON translations
  const parseTranslation = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr)
      return parsed[locale] || parsed["en"] || jsonStr
    } catch {
      return jsonStr
    }
  }

  const title = parseTranslation(pageData.title)
  const { widgets, isLocked } = pageData

  // Row Synchronization Math Engine: Group by Y coordinate and compute the maximum height per row
  const synchronizedWidgets = React.useMemo(() => {
    const rowHeights: Record<number, number> = {}
    const rowMeta: Record<number, { hasTitle: boolean, hasSubText: boolean }> = {}

    widgets.forEach((w: any) => {
      let config: any = {}
      try { config = JSON.parse(w.configJson) } catch (e) { }

      let requiredH = w.h;

      // If a widget visibly renders a summary text element, we mathematically guarantee extra layout bounds
      const hasVisibleSummary = config.showSubText !== false && (config.subText?.trim() || w.componentKey === "PIE_CHART")
      if (hasVisibleSummary) {
        requiredH = Math.max(requiredH, 4)
      }

      rowHeights[w.y] = Math.max(rowHeights[w.y] || 0, requiredH)

      if (!rowMeta[w.y]) rowMeta[w.y] = { hasTitle: false, hasSubText: false }
      if (config.showTitle !== false) rowMeta[w.y].hasTitle = true
      if (hasVisibleSummary) rowMeta[w.y].hasSubText = true
    })

    return widgets.map((w: any) => ({
      ...w,
      rowSync: rowMeta[w.y]
    }))
  }, [widgets])

  const onLayoutChange = async (newLayout: any) => {
    // Array of { i: string, x: number, y: number, w: number, h: number }
    const mapped = newLayout.map((item: any) => ({
      id: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h
    }))

    // Fire-and-forget background sync
    await updateWidgetGridPosition(mapped)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-12 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h1>
          </div>
        </header>

        <div className="w-full relative">
          <ResponsiveGridLayout
            className="layout"
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            draggableHandle=".drag-handle"
            onLayoutChange={onLayoutChange}
            isDraggable={!isLocked}
            isResizable={!isLocked}
          >
            {synchronizedWidgets.map((widget: any) => {
              const WidgetComponent = WidgetRegistry[widget.componentKey]
              if (!WidgetComponent) return (
                <div key={widget.id} data-grid={{ i: widget.id, x: widget.x, y: widget.y, w: widget.w, h: widget.h }} className="text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 p-4 rounded border border-red-200 dark:border-red-500/20">
                  Missing CMS Component: {widget.componentKey}
                </div>
              )

              let config = {}
              try { config = JSON.parse(widget.configJson) } catch (e) { }

              // Use widget.h exactly as dragged/stored to prevent overlap issues
              return (
                <div key={widget.id} data-grid={{ i: widget.id, x: widget.x, y: widget.y, w: widget.w, h: widget.h }} className="h-full relative group">
                  {/* Floating top drag handle overlay */}
                  {!isLocked && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 drag-handle cursor-grab active:cursor-grabbing shadow-xl backdrop-blur-md">
                      <GripHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 pointer-events-none" />
                      <span className="text-[10px] text-slate-700 dark:text-slate-200 font-bold uppercase tracking-widest select-none pointer-events-none">Move Widget</span>
                    </div>
                  )}

                  <div className="w-full h-full pointer-events-auto">
                    <WidgetComponent config={config} widget={widget} rowSync={widget.rowSync} />
                  </div>
                </div>
              )
            })}
          </ResponsiveGridLayout>
        </div>
      </div>
    </div>
  )
}
