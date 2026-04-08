"use client"

import React, { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronRight, ChevronLeft, Terminal, Search, Filter, Settings, Plus, Trash2, ArrowUp, ArrowDown, X, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

interface MasterDetailTableProps {
  widget?: any
  config?: any
  previewData?: any[]
}

export function MasterDetailTable({ widget, config, previewData }: MasterDetailTableProps) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(!previewData)

  const parentColsRaw = config?.parentCols || ""
  const childColsRaw = config?.childCols || ""
  const primaryKey = config?.tablePrimaryKey || "id"
  const customActions = config?.customActions || []
  const columnStyles = config?.columnStyles || {}

  const parentCols = parentColsRaw.split(",").map((c: string) => c.trim()).filter(Boolean)
  const childCols = childColsRaw.split(",").map((c: string) => c.trim()).filter(Boolean)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(Number(config?.pageSize) || (config?.paginationOptions === "ALL" ? 1000 : 10))
  useEffect(() => { if (config?.pageSize) setRowsPerPage(Number(config.pageSize)) }, [config?.pageSize])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionTelemetry, setActionTelemetry] = useState<Record<string, { status: 'running'|'success'|'failed', details?: any, title: string, timestamp: number }>>({})
  const [focusedTelemetryId, setFocusedTelemetryId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [globalSearchQuery, setGlobalSearchQuery] = useState("")
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null)
  const getActionBtnClasses = (telemetry: any, baseClasses: string = "px-4 py-3 text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2") => {
     if (!telemetry || (!telemetry.status)) return `${baseClasses} bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 border disabled:opacity-50`
     if (telemetry.status === 'running') return `${baseClasses} bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600 opacity-80 cursor-wait`
     if (telemetry.status === 'success') return `${baseClasses} bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-[3px] border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/60`
     if (telemetry.status === 'failed') return `${baseClasses} bg-rose-50 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-[3px] border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/60`
     return `${baseClasses}`
  }

  const renderActionIcon = (telemetry: any, defaultSize: string = "w-4 h-4") => {
     if (!telemetry || !telemetry.status) return null
     if (telemetry.status === 'running') return <Loader2 className={`${defaultSize} animate-spin`} />
     if (telemetry.status === 'success') return <CheckCircle2 className={`${defaultSize}`} />
     if (telemetry.status === 'failed') return <AlertTriangle className={`${defaultSize}`} />
     return null
  }


  const availableKeys = useMemo(() => {
     if (metrics.length > 0) return Object.keys(metrics[0]).filter(k => typeof metrics[0][k] !== "object" || Array.isArray(metrics[0][k]))
     return []
  }, [metrics])

  // Reset page when data size drastically changes
  useEffect(() => {
    setCurrentPage(1)
  }, [widget?.id])

  const filterableColumns = useMemo(() => {
     const _elementSettings = config?.elementSettings || {}
     const cols = Object.keys(_elementSettings).filter(k => _elementSettings[k]?.isFilterable)
     
     const colValues: Record<string, string[]> = {}
     cols.forEach(col => {
        const uniqueSet = new Set<string>()
        metrics.forEach((row: any) => {
           if (row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== "") {
              uniqueSet.add(String(row[col]))
           }
        })
        colValues[col] = Array.from(uniqueSet).sort()
     })
     return colValues
  }, [metrics, config?.elementSettings])

  const filteredAndSortedMetrics = useMemo(() => {
     let result = [...metrics]
     const _elementSettings = config?.elementSettings || {}
     
     if (globalSearchQuery.trim() !== "") {
        const query = globalSearchQuery.toLowerCase()
        const searchableKeys = Object.keys(_elementSettings).filter(k => _elementSettings[k]?.isSearchable)
        if (searchableKeys.length > 0) {
           result = result.filter((row: any) => {
              return searchableKeys.some(key => {
                 const val = row[key]
                 if (val === undefined || val === null) return false
                 return String(val).toLowerCase().includes(query)
              })
           })
        }
     }

     if (Object.keys(columnFilters).length > 0) {
        result = result.filter((row: any) => {
           return Object.entries(columnFilters).every(([colKey, filterVal]) => {
              if (filterVal === "") return true;
              return String(row[colKey]) === filterVal;
           })
        })
     }

     if (sortConfig) {
        result.sort((a, b) => {
           let valA = a[sortConfig.key]
           let valB = b[sortConfig.key]
           if (valA === undefined || valA === null) valA = ""
           if (valB === undefined || valB === null) valB = ""
           
           if (typeof valA === 'string' && typeof valB === 'string') {
               const cmp = valA.localeCompare(valB, undefined, { numeric: true })
               return sortConfig.direction === 'asc' ? cmp : -cmp
           }
           if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
           if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
           return 0;
        })
     }
     
     return result
  }, [metrics, globalSearchQuery, columnFilters, sortConfig, config?.elementSettings])

  const paginatedMetrics = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredAndSortedMetrics.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredAndSortedMetrics, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredAndSortedMetrics.length / rowsPerPage)

  useEffect(() => {
    if (previewData) {
      setMetrics(previewData)
      setLoading(false)
      return
    }

    let intervalId: NodeJS.Timeout
    
    async function initData(isBackground = false) {
      if (!isBackground) setLoading(true)
      try {
        const res = await fetch('/api/cms/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetId: widget?.id })
        })
        const json = await res.json()

        if (json.data && Array.isArray(json.data)) {
          if (isBackground) {
             setMetrics(prevMetrics => {
                if (prevMetrics.length === 0) return json.data;
                const orderMap = new Map();
                prevMetrics.forEach((m: any, idx: number) => orderMap.set(String(m[primaryKey]), idx));
                
                return [...json.data].sort((a: any, b: any) => {
                   const aIdx = orderMap.has(String(a[primaryKey])) ? orderMap.get(String(a[primaryKey])) : Infinity;
                   const bIdx = orderMap.has(String(b[primaryKey])) ? orderMap.get(String(b[primaryKey])) : Infinity;
                   return aIdx - bIdx;
                });
             });
          } else {
             setMetrics(json.data)
          }
        } else {
           setMetrics([])
        }
      } catch (err) {
        console.error("Failed to map widget dataset", err)
      } finally {
        if (!isBackground) setLoading(false)
      }
    }

    initData(refreshTrigger > 0)
    // Constant polling fallback map
    intervalId = setInterval(() => initData(true), 10000)

    return () => clearInterval(intervalId)
  }, [widget?.id, previewData, refreshTrigger])

  const executeAction = async (action: any, rowData: any) => {
     const actionId = `${action.name}-${rowData[primaryKey]}`
     try {
        setActionTelemetry(prev => ({...prev, [actionId]: { status: 'running', title: action.name, timestamp: Date.now() }}))
        setFocusedTelemetryId(actionId)
        
        let hydratedEndpoint = action.endpoint || ""
        Object.keys(rowData).forEach(k => { hydratedEndpoint = hydratedEndpoint.replace(new RegExp(`{${k}}`, 'g'), String(rowData[k])) })

        let hydratedPayload = ""
        if (action.payloadTemplate) {
           hydratedPayload = action.payloadTemplate
           Object.keys(rowData).forEach(k => { hydratedPayload = hydratedPayload.replace(new RegExp(`{${k}}`, 'g'), String(rowData[k])) })
        }

        const res = await fetch('/api/cms/execute', {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
              dataSourceId: action.dataSourceId,
              type: action.type,
              method: action.method,
              endpoint: hydratedEndpoint,
              payload: hydratedPayload
           })
        })

        let responseData: any = null
        try { responseData = await res.json() } catch { responseData = await res.text() }

        if (!res.ok) {
           throw new Error(responseData?.error || (typeof responseData === 'string' ? responseData : JSON.stringify(responseData)))
        }

        setActionTelemetry(prev => ({...prev, [actionId]: { status: 'success', details: responseData, title: action.name, timestamp: Date.now() }}))

        // Silent refresh preservation mechanism
        setRefreshTrigger(prev => prev + 1)

     } catch (e: any) {
        setActionTelemetry(prev => ({...prev, [actionId]: { status: 'failed', details: e.message || 'Unknown error occurred', title: action.name, timestamp: Date.now() }}))
     }
  }

  if (loading) return <div className="w-full h-full flex items-center justify-center text-center text-slate-400 animate-pulse font-mono tracking-widest text-xs">AWAITING MATRIX DATA...</div>
  
  const isCustomLayout = !!config?.layoutLines && config.layoutLines.length > 0
  const layoutLines = config?.layoutLines || []
  const mainLines = layoutLines.filter((l: any) => !l.id.startsWith("drawer"))
  const drawerLines = layoutLines.filter((l: any) => l.id.startsWith("drawer"))
  
  const elementSettings = config?.elementSettings || {}
  const lineSettings = config?.lineSettings || {}

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden transition-colors">
      {/* Title block */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
         {config?.showTitle !== false ? (
           <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {config?.title || "Dynamic Master-Detail Table"}
           </h3>
         ) : <div />}
         <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono tracking-widest uppercase flex items-center gap-2">
               <Search className="w-3 h-3 text-slate-500" />
               {metrics.length} Rows Synced
            </div>
         </div>
      </div>
      
      {/* Datatables Operations Toolbar */}
      {(Object.values(elementSettings).some((s: any) => s.isSearchable) || Object.values(elementSettings).some((s: any) => s.isSortable) || Object.values(elementSettings).some((s: any) => s.isFilterable)) && (
         <div className="flex flex-col sm:flex-row gap-4 flex-wrap justify-between items-center px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            
            {/* Left Box: Filters & Search */}
            <div className="flex flex-grow flex-wrap items-center gap-3 w-full sm:w-auto">
               {/* Search Pipeline */}
               {Object.values(elementSettings).some((s: any) => s.isSearchable) && (
                  <div className="relative w-full sm:max-w-xs shrink-0">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                     </div>
                     <input
                        type="text"
                        placeholder="Search records..."
                        value={globalSearchQuery}
                        onChange={(e) => { setGlobalSearchQuery(e.target.value); setCurrentPage(1) }}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors shadow-sm"
                     />
                  </div>
               )}

               {/* Column Filters Plugin */}
               {Object.keys(filterableColumns).map((colKey) => (
                  <select
                     key={colKey}
                     value={columnFilters[colKey] || ""}
                     onChange={(e) => {
                        setColumnFilters(prev => ({...prev, [colKey]: e.target.value}))
                        setCurrentPage(1)
                     }}
                     className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg py-2 px-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm cursor-pointer min-w-[120px]"
                  >
                     <option value="">All {colKey}s</option>
                     {filterableColumns[colKey].map(val => (
                        <option key={val} value={val}>{val}</option>
                     ))}
                  </select>
               ))}
            </div>


            {/* Sort Pipeline */}
            {Object.values(elementSettings).some((s: any) => s.isSortable) && (
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Sort Map:</span>
                  <select 
                     value={sortConfig?.key || ""} 
                     onChange={(e) => setSortConfig(e.target.value ? { key: e.target.value, direction: sortConfig?.direction || 'asc' } : null)}
                     className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm cursor-pointer"
                  >
                     <option value="">Default Timeline</option>
                     {Object.keys(elementSettings).filter(k => elementSettings[k]?.isSortable).map(k => (
                        <option key={k} value={k}>{k}</option>
                     ))}
                  </select>
                  {sortConfig && (
                     <button 
                        onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                        className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                     >
                        {sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                     </button>
                  )}
               </div>
            )}
         </div>
      )}
      {isCustomLayout ? (
        <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
           {paginatedMetrics.length === 0 && (
               <div className="p-8 text-center text-slate-500 text-sm font-medium">
                 Awaiting Data. Map properties inside the Visual Record Builder to proceed.
               </div>
           )}
           {paginatedMetrics.map((row: any, i: number) => {
              const rowId = row[primaryKey] || `m-row-${i}-${currentPage}`
              const isExpanded = expandedRow === rowId
              
              return (
                 <div key={rowId} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md">
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : rowId)}>
                       {mainLines.map((line: any, lIdx: number) => {
                          const lStyle = lineSettings[line.id] || {}
                          const justifyClass = lStyle.justify ? `justify-${lStyle.justify}` : 'justify-start'
                          
                          return (
                          <div key={line.id} className={`grid grid-cols-12 gap-x-2 gap-y-4 items-center ${lIdx !== mainLines.length - 1 ? 'mb-3' : ''}`}>
                             {line.cols.map((colKey: string) => {
                                const elConfig = elementSettings[colKey] || {}
                                const spanWidth = elConfig.width === 'full' ? 12 : elConfig.width === '1/2' ? 6 : elConfig.width === '1/3' ? 4 : elConfig.width === '1/4' ? 3 : 2
                                const startCol = elConfig.startCol || 1
                                const labelPos = elConfig.labelPos || 'top' // top, inline, hidden
                                const alignClass = elConfig.align === 'center' ? 'text-center items-center justify-center' : elConfig.align === 'right' ? 'text-right items-end justify-end' : 'text-left items-start justify-start'
                                const renderType = elConfig.renderType || columnStyles[colKey] || "text"

                                if (colKey.startsWith("__action_")) {
                                   const actionName = colKey.replace("__action_", "")
                                   const actionObj = customActions.find((a: any) => a.name === actionName)
                                   if (!actionObj) return null
                                   const telemetry = actionTelemetry[`${actionObj.name}-${rowId}`]
                                   const isLoading = telemetry?.status === 'running'
                                   
                                   return (
                                      <div key={colKey} className={`flex w-full ${alignClass}`} style={{ gridColumn: `${startCol} / span ${spanWidth}`, gridRow: 1 }}>
                                         <button
                                            disabled={isLoading}
                                            onClick={(e) => { e.stopPropagation(); executeAction(actionObj, row) }}
                                            className={getActionBtnClasses(telemetry, "w-full h-full px-4 py-3 text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2")}
                                         >
                                            {renderActionIcon(telemetry, "w-4 h-4")}
                                            {actionObj.name}
                                         </button>
                                      </div>
                                   )
                                }
                                
                                const val = row[colKey]
                                const text = val !== null && val !== undefined ? String(val) : "-"
                                
                                let colorStyle = "text-slate-700 dark:text-slate-300"
                                let wrapperClass = ""
         
                                if (typeof val === "string") {
                                  const lower = val.toLowerCase()
                                  if (['running', 'online', 'ok', 'active', 'success'].includes(lower)) colorStyle = "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                                  else if (['offline', 'down', 'error', 'failed', 'critical'].includes(lower)) colorStyle = "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
                                  else if (['warning', 'pending', 'syncing'].includes(lower)) colorStyle = "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                                  else if (renderType === "badge") colorStyle = "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30"
                                } else if (renderType === "badge") {
                                   colorStyle = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                                }
         
                                if (colorStyle.includes("bg-") || renderType === "badge") {
                                   wrapperClass = `${colorStyle} px-2.5 py-1 rounded-md border text-[11px] font-bold shadow-sm inline-block`
                                }
                                
                                return (
                                   <div key={colKey} className={`flex ${labelPos === 'inline' ? 'flex-row items-center gap-2' : 'flex-col gap-1'} w-full overflow-hidden ${alignClass}`} style={{ gridColumn: `${startCol} / span ${spanWidth}`, gridRow: 1 }}>
                                      {labelPos !== 'hidden' && (
                                         <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold shrink-0">{colKey}</span>
                                      )}
                                      <div className={wrapperClass ? wrapperClass : `${colorStyle} text-sm font-medium`}>{text}</div>
                                   </div>
                                )
                             })}
                          </div>
                       )})}
                    </div>
                    
                    {/* Drawer Expansion Area */}
                    {isExpanded && (
                       <div className="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 p-5 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                             
                             <div className="flex flex-col gap-6">
                               {drawerLines.map((dLine: any) => {
                                 const trackCols = dLine.cols || []
                                 return (
                                   <div key={dLine.id} className="flex flex-col gap-2">
                                      {trackCols.filter((col: string) => !Array.isArray(row[col])).length > 0 && (
                                         <div className="grid grid-cols-12 gap-x-2 gap-y-4">
                                           {trackCols.filter((col: string) => !Array.isArray(row[col])).map((colKey: string) => {
                                              const elConfig = elementSettings[colKey] || {}
                                              const spanWidth = elConfig.width === 'full' ? 12 : elConfig.width === '1/2' ? 6 : elConfig.width === '1/3' ? 4 : elConfig.width === '1/4' ? 3 : 2
                                              const startCol = elConfig.startCol || 1
                                              const labelPos = elConfig.labelPos || 'top'
                                              const alignClass = elConfig.align === 'center' ? 'text-center items-center justify-center' : elConfig.align === 'right' ? 'text-right items-end justify-end' : 'text-left items-start justify-start'
                                              
                                              if (colKey.startsWith("__action_")) {
                                                 const actionName = colKey.replace("__action_", "")
                                                 const actionObj = customActions.find((a: any) => a.name === actionName)
                                                 if (!actionObj) return null
                                                 const telemetry = actionTelemetry[`${actionObj.name}-${rowId}`]; const isLoading = telemetry?.status === 'running'
                                                 
                                                 return (
                                                    <div key={colKey} className={`flex w-full h-full ${alignClass}`} style={{ gridColumn: `${startCol} / span ${spanWidth}`, gridRow: 1 }}>
                                                       <button
                                                          disabled={isLoading}
                                                          onClick={(e) => { e.stopPropagation(); executeAction(actionObj, row) }}
                                                          className={getActionBtnClasses(telemetry, "w-full h-full px-4 py-3 text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2")}
                                                       >
                                                          {renderActionIcon(telemetry, "w-4 h-4")}
                                                          {actionObj.name}
                                                       </button>
                                                    </div>
                                                 )
                                              }

                                              const val = row[colKey]
                                              const renderVal = val !== null && val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : "undefined"
                                              const renderType = elConfig.renderType || columnStyles[colKey] || "text"
                                              
                                              return (
                                                 <div key={colKey} className={`flex ${labelPos === 'inline' ? 'flex-row items-center gap-3' : 'flex-col gap-1.5'} bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm ${alignClass}`} style={{ gridColumn: `${startCol} / span ${spanWidth}`, gridRow: 1 }}>
                                                    {labelPos !== 'hidden' && (
                                                      <span className="text-[10px] uppercase tracking-widest text-indigo-400 dark:text-indigo-300 font-bold shrink-0">{colKey}</span>
                                                    )}
                                                    <span className={`text-slate-700 dark:text-slate-300 text-sm truncate font-mono ${renderType === 'badge' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 font-bold' : ''}`} title={renderVal}>{renderVal}</span>
                                                 </div>
                                              )
                                           })}
                                         </div>
                                      )}

                                      {trackCols.filter((col: string) => !col.startsWith("__action_") && Array.isArray(row[col])).map((col: string) => {
                                         const arr = row[col] as any[]
                                         if (arr.length === 0) return null
                                         const innerCols = Object.keys(arr[0]).filter(k => typeof arr[0][k] !== "object")
                                         return (
                                            <div key={col} className="mt-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                                               <h5 className="text-[10px] uppercase tracking-widest text-sky-500 dark:text-sky-400 font-bold p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 m-0"><Settings className="w-3 h-3 inline pb-0.5" /> List Array: {col}</h5>
                                               <div className="overflow-x-auto max-h-60 custom-scrollbar">
                                                  <table className="w-full text-left border-collapse text-xs">
                                                     <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 shadow-sm z-10">
                                                        <tr>
                                                           {innerCols.map(ic => <th key={ic} className="p-2 font-bold whitespace-nowrap text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">{ic}</th>)}
                                                        </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {arr.map((item, idxx) => (
                                                           <tr key={idxx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                              {innerCols.map(ic => <td key={ic} className="p-2 whitespace-nowrap text-slate-600 dark:text-slate-400">{String(item[ic] ?? "-")}</td>)}
                                                           </tr>
                                                        ))}
                                                     </tbody>
                                                  </table>
                                               </div>
                                            </div>
                                         )
                                      })}
                                   </div>
                                 )
                               })}
                             </div>
                       </div>
                    )}
                 </div>
              )
           })}
        </div>
      ) : (
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <th className="p-4 font-semibold w-12 text-center">+/-</th>
              {parentCols.map((col: string) => (
                <th key={col} className="p-4 font-semibold whitespace-nowrap">{col}</th>
              ))}
              {customActions.some((a: any) => a.placement === "main") && (
                <th className="p-4 font-semibold whitespace-nowrap text-right"><Terminal className="inline w-3 h-3 text-indigo-400 mr-1" /> Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
             {paginatedMetrics.length === 0 && (
                <tr>
                  <td colSpan={parentCols.length + 1} className="p-8 text-center text-slate-500 text-sm font-medium">
                    No generic array mappings found. Verify your JSON arrays.
                  </td>
                </tr>
             )}
            {paginatedMetrics.map((row: any, i: number) => {
              const rowId = row[primaryKey] || `m-row-${i}-${currentPage}`
              const isExpanded = expandedRow === rowId
              return (
                <React.Fragment key={rowId}>
                  <tr 
                    onClick={() => setExpandedRow(isExpanded ? null : rowId)}
                    className={`cursor-pointer transition-colors text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/20' : ''}`}
                  >
                    <td className="p-4 content-center">
                      <button className="text-slate-500 hover:text-indigo-400 transition-colors focus:outline-none w-full flex justify-center">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    {parentCols.map((col: string) => {
                       const val = row[col]
                       const text = val !== null && val !== undefined ? String(val) : "-"
                       
                       // Small heuristic to colorize values that look like status
                       let colorStyle = "text-slate-600 dark:text-slate-300"
                       let wrapperClass = ""

                       const renderType = columnStyles[col] || "text"
                       
                       if (typeof val === "string") {
                         const lower = val.toLowerCase()
                         if (['running', 'online', 'ok', 'active', 'success'].includes(lower)) colorStyle = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                         else if (['offline', 'down', 'error', 'failed', 'critical'].includes(lower)) colorStyle = "text-rose-400 bg-rose-400/10 border-rose-400/20"
                         else if (['warning', 'pending', 'syncing'].includes(lower)) colorStyle = "text-amber-400 bg-amber-400/10 border-amber-400/20"
                         else if (renderType === "badge") colorStyle = "bg-indigo-600 text-white dark:bg-indigo-500 border-indigo-700"
                       } else if (renderType === "badge") {
                          colorStyle = "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
                       }

                       if (colorStyle.includes("bg-") || renderType === "badge") {
                          wrapperClass = `${colorStyle} px-2.5 py-1 rounded-md border text-xs font-bold shadow-sm inline-block`
                       }

                       return (
                         <td key={col} className="p-4 text-sm whitespace-nowrap">
                            <div className={wrapperClass ? wrapperClass : colorStyle}>{text}</div>
                         </td>
                       )
                    })}
                    {customActions.some((a: any) => a.placement === "main") && (
                       <td className="p-4 text-right flex items-center justify-end gap-2">
                          {customActions.filter((a: any) => a.placement === "main").map((action: any, idx: number) => {
                             const telemetry = actionTelemetry[`${action.name}-${rowId}`]
                             const isLoading = telemetry?.status === 'running'
                             return (
                                <button
                                   key={`main-act-${idx}`}
                                   disabled={isLoading}
                                   onClick={(e) => { e.stopPropagation(); executeAction(action, row) }}
                                   className={getActionBtnClasses(telemetry, "px-3 py-1.5 text-xs font-bold rounded-md shadow-sm transition-all flex items-center gap-2")}
                                >
                                   {renderActionIcon(telemetry, "w-3.5 h-3.5")}
                                   {action.name}
                                </button>
                             )
                          })}
                       </td>
                    )}
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-indigo-200 dark:border-indigo-500/20">
                      <td colSpan={parentCols.length + 1} className="p-0">
                        <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-4 col-span-full">
                            <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 font-mono text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 flex flex-col gap-6 shadow-inner">
                               
                               {/* Render Flat Properties */}
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                                 {childCols.filter((col: string) => !Array.isArray(row[col])).map((col: string) => {
                                    const val = row[col]
                                    const renderVal = val !== null && val !== undefined 
                                      ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) 
                                      : "undefined"
                                    
                                    return (
                                       <div key={col} className="flex flex-col gap-1.5 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 dark:text-indigo-300/80 font-bold">{col}</span>
                                          <span className="text-slate-800 dark:text-slate-200 truncate" title={renderVal}>{renderVal}</span>
                                       </div>
                                    )
                                 })}
                               </div>

                               {/* Render Recursive Array Objects */}
                               {childCols.filter((col: string) => Array.isArray(row[col])).map((col: string) => {
                                  const arr = row[col] as any[]
                                  if (arr.length === 0) return null
                                  const innerCols = Object.keys(arr[0]).filter(k => typeof arr[0][k] !== "object")
                                  
                                  return (
                                     <div key={col} className="mt-4">
                                        <h5 className="text-[10px] uppercase tracking-widest text-sky-500 dark:text-sky-400 font-bold mb-3 flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> Embedded Dataset: {col}</h5>
                                        <div className="overflow-x-auto overflow-y-auto max-h-64 custom-scrollbar rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 shadow-inner">
                                           <table className="w-full text-left border-collapse text-xs">
                                              <thead className="sticky top-0 bg-slate-200 dark:bg-slate-800 shadow-sm z-10">
                                                 <tr>
                                                    {innerCols.map(ic => <th key={ic} className="p-2 font-bold whitespace-nowrap text-slate-700 dark:text-slate-300">{ic}</th>)}
                                                 </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                 {arr.map((item, idxx) => (
                                                    <tr key={idxx} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors pointer-events-auto">
                                                       {innerCols.map(ic => <td key={ic} className="p-2 whitespace-nowrap text-slate-600 dark:text-slate-400">{String(item[ic] ?? "-")}</td>)}
                                                    </tr>
                                                 ))}
                                              </tbody>
                                           </table>
                                        </div>
                                     </div>
                                  )
                               })}

                               {childCols.length === 0 && <p className="text-slate-500 italic text-xs">No detail columns specified.</p>}
                            </div>
                            
                            {/* Action Buttons Panel */}
                            {customActions.some((a: any) => !a.placement || a.placement === "detail") && (
                               <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
                                  <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs mb-3 uppercase tracking-widest"><Terminal className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Embedded Actions</h4>
                                  <div className="flex flex-wrap gap-3">
                                     {customActions.filter((a: any) => !a.placement || a.placement === "detail").map((action: any, idx: number) => {
                                        const telemetry = actionTelemetry[`${action.name}-${rowId}`]; const isLoading = telemetry?.status === 'running';
                                        return (
                                           <button 
                                             key={idx} 
                                             disabled={isLoading}
                                             onClick={() => executeAction(action, row)} 
                                             className={getActionBtnClasses(telemetry, "px-4 py-2 text-xs font-bold rounded-lg shadow transition-all flex items-center gap-2")}
                                           >
                                              {renderActionIcon(telemetry, "w-4 h-4")}
                                              {action.name}
                                           </button>
                                        )
                                     })}
                                  </div>
                               </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination Footer Engine */}
      <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-md">
         <div className="flex items-center gap-3">
             <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase flex items-center gap-1">
                Showing <span className="text-indigo-500 dark:text-indigo-400 font-bold ml-1">{(currentPage - 1) * rowsPerPage + (metrics.length > 0 ? 1 : 0)}</span> - <span className="text-indigo-500 dark:text-indigo-400 font-bold">{Math.min(currentPage * rowsPerPage, metrics.length)}</span> of <span className="text-slate-800 dark:text-slate-200">{metrics.length}</span>
             </div>
             {metrics.length > 0 && (
                 <select 
                    value={rowsPerPage} 
                    onChange={e => {
                       setRowsPerPage(Number(e.target.value))
                       setCurrentPage(1)
                    }} 
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 cursor-pointer transition-colors"
                 >
                     <option value={5}>5 Rows</option>
                    <option value={10}>10 Rows (Standard)</option>
                    <option value={50}>50 Rows</option>
                    <option value={100}>100 Rows</option>
                    <option value={1000}>All Rows (Full Page)</option>
                 </select>
             )}
         </div>

         <div className="flex items-center gap-1.5">
            <button 
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1 || metrics.length === 0}
               className="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/30 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
               <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-500">
               {totalPages === 0 ? 0 : currentPage} / {totalPages}
            </div>
            <button 
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage >= totalPages || metrics.length === 0}
               className="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/30 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
               <ChevronRight className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Deep Feedback & Telemetry Process Modal */}
      {focusedTelemetryId && actionTelemetry[focusedTelemetryId] && (
         <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 xs:p-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
               <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                     {actionTelemetry[focusedTelemetryId].status === 'running' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                     {actionTelemetry[focusedTelemetryId].status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                     {actionTelemetry[focusedTelemetryId].status === 'failed' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
                     <h3 className="font-bold text-slate-800 dark:text-slate-200">{actionTelemetry[focusedTelemetryId].title}</h3>
                  </div>
                  <button onClick={() => setFocusedTelemetryId(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="p-5 overflow-y-auto max-h-[60vh] bg-slate-50/30 dark:bg-slate-950/50">
                  {actionTelemetry[focusedTelemetryId].status === 'running' && (
                     <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                        <span className="font-mono text-sm tracking-widest uppercase">Executing Backend Sequence...</span>
                     </div>
                  )}
                  {actionTelemetry[focusedTelemetryId].status !== 'running' && (
                     <div className="space-y-3">
                        <div className={`p-4 rounded-lg border flex items-start gap-4 ${actionTelemetry[focusedTelemetryId].status === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300'}`}>
                           <div className="mt-0.5">
                              {actionTelemetry[focusedTelemetryId].status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                           </div>
                           <div>
                              <p className="font-semibold">{actionTelemetry[focusedTelemetryId].status === 'success' ? 'Execution Completed Successfully' : 'Execution Failed'}</p>
                              <p className="text-sm opacity-80 mt-1">Timestamp: {new Date(actionTelemetry[focusedTelemetryId].timestamp).toLocaleTimeString()}</p>
                           </div>
                        </div>
                        {actionTelemetry[focusedTelemetryId].details && (
                           <div className="mt-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Raw Telemetry</p>
                              <pre className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap shadow-inner">
                                 {typeof actionTelemetry[focusedTelemetryId].details === 'object' ? JSON.stringify(actionTelemetry[focusedTelemetryId].details, null, 2) : String(actionTelemetry[focusedTelemetryId].details)}
                              </pre>
                           </div>
                        )}
                     </div>
                  )}
               </div>
               {actionTelemetry[focusedTelemetryId].status !== 'running' && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex justify-end">
                     <button onClick={() => setFocusedTelemetryId(null)} className="px-5 py-2 font-bold text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-sm transition-colors">Acknowledge</button>
                  </div>
               )}
            </div>
         </div>
      )}

    </div>
  )
}
