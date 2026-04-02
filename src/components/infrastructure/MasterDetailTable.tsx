"use client"

import React, { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronRight, ChevronLeft, Terminal, Search, Filter, Settings, Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react"

interface MasterDetailTableProps {
  widget?: any
  config?: any
  previewData?: any[]
}

export function MasterDetailTable({ widget, config, previewData }: MasterDetailTableProps) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(!previewData)

  const parentColsRaw = config?.parentCols || "hostname,os,agentStatus"
  const childColsRaw = config?.childCols || "appOwner,techStack,syncProgress,updatedAt"
  const primaryKey = config?.tablePrimaryKey || "id"
  const customActions = config?.customActions || []
  const columnStyles = config?.columnStyles || {}

  const parentCols = parentColsRaw.split(",").map((c: string) => c.trim()).filter(Boolean)
  const childCols = childColsRaw.split(",").map((c: string) => c.trim()).filter(Boolean)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(config?.paginationOptions === "ALL" ? 1000 : 10)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const availableKeys = useMemo(() => {
     if (metrics.length > 0) return Object.keys(metrics[0]).filter(k => typeof metrics[0][k] !== "object" || Array.isArray(metrics[0][k]))
     return []
  }, [metrics])

  // Reset page when data size drastically changes
  useEffect(() => {
    setCurrentPage(1)
  }, [widget?.id])

  const paginatedMetrics = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return metrics.slice(startIndex, startIndex + rowsPerPage)
  }, [metrics, currentPage, rowsPerPage])

  const totalPages = Math.ceil(metrics.length / rowsPerPage)

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
          setMetrics(json.data)
        } else {
           setMetrics([])
        }
      } catch (err) {
        console.error("Failed to map widget dataset", err)
      } finally {
        if (!isBackground) setLoading(false)
      }
    }

    initData(false)
    // Constant polling fallback map
    intervalId = setInterval(() => initData(true), 10000)

    return () => clearInterval(intervalId)
  }, [widget?.id, previewData])

  const executeAction = async (action: any, rowData: any) => {
     try {
        setActionLoading(`${action.name}-${rowData[primaryKey]}`)
        
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

        if (!res.ok) {
           const errJson = await res.json().catch(() => ({}))
           throw new Error(errJson.error || await res.text())
        }
     } catch (e: any) {
        alert(`Action "${action.name}" failed: ${e.message}`)
     } finally {
        setActionLoading(null)
     }
  }

  if (loading) return <div className="w-full h-full flex items-center justify-center text-center text-slate-400 animate-pulse font-mono tracking-widest text-xs">AWAITING MATRIX DATA...</div>
  
  const isCustomLayout = !!config?.layoutLines && config.layoutLines.length > 0
  const layoutLines = config?.layoutLines || []
  const mainLines = layoutLines.filter((l: any) => l.id !== "drawer")
  const drawerLine = layoutLines.find((l: any) => l.id === "drawer")?.cols || []
  
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
      
      {isCustomLayout ? (
        <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
           {paginatedMetrics.length === 0 && (
               <div className="p-8 text-center text-slate-500 text-sm font-medium">
                 No generic array mappings found. Verify your JSON arrays.
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
                          <div key={line.id} className={`flex items-center flex-wrap gap-4 ${justifyClass} ${lIdx !== mainLines.length - 1 ? 'mb-3' : ''}`}>
                             {line.cols.map((colKey: string) => {
                                const elConfig = elementSettings[colKey] || {}
                                const widthClass = elConfig.width === 'full' ? 'w-full' : elConfig.width === '1/2' ? 'w-[calc(50%-8px)]' : elConfig.width === '1/3' ? 'w-[calc(33.33%-10px)]' : elConfig.width === '1/4' ? 'w-[calc(25%-12px)]' : 'min-w-[100px]'
                                const labelPos = elConfig.labelPos || 'top' // top, inline, hidden
                                const alignClass = elConfig.align === 'center' ? 'text-center items-center justify-center' : elConfig.align === 'right' ? 'text-right items-end justify-end' : 'text-left items-start justify-start'
                                const renderType = elConfig.renderType || columnStyles[colKey] || "text"

                                if (colKey.startsWith("__action_")) {
                                   const actionName = colKey.replace("__action_", "")
                                   const actionObj = customActions.find((a: any) => a.name === actionName)
                                   if (!actionObj) return null
                                   const isLoading = actionLoading === `${actionObj.name}-${rowId}`
                                   
                                   return (
                                      <div key={colKey} className={`flex ${widthClass} ${alignClass}`}>
                                         <button
                                            disabled={isLoading}
                                            onClick={(e) => { e.stopPropagation(); executeAction(actionObj, row) }}
                                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-[11px] text-indigo-700 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-500/30 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                                         >
                                            {isLoading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : <Terminal className="w-3 h-3 opacity-70" />}
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
                                   <div key={colKey} className={`flex ${labelPos === 'inline' ? 'flex-row items-center gap-2' : 'flex-col gap-1'} ${widthClass} ${alignClass}`}>
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
                             <div className="flex items-center justify-between mb-4 pb-2 border-b border-indigo-100 dark:border-indigo-500/20">
                               <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
                                 <Search className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Detail Inspector (Key: {rowId})
                               </h4>
                               {drawerLine.filter((k: string) => k.startsWith("__action_")).length > 0 && (
                                  <div className="flex items-center gap-2">
                                     {drawerLine.filter((k: string) => k.startsWith("__action_")).map((colKey: string) => {
                                        const actionName = colKey.replace("__action_", "")
                                        const actionObj = customActions.find((a: any) => a.name === actionName)
                                        if (!actionObj) return null
                                        const isLoading = actionLoading === `${actionObj.name}-${rowId}`
                                        return (
                                           <button key={colKey} disabled={isLoading} onClick={() => executeAction(actionObj, row)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5">
                                             {isLoading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : null}
                                             {actionObj.name}
                                           </button>
                                        )
                                     })}
                                  </div>
                               )}
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {drawerLine.filter((col: string) => !col.startsWith("__action_") && !Array.isArray(row[col])).map((col: string) => {
                                  const val = row[col]
                                  const renderVal = val !== null && val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : "undefined"
                                  
                                  const elConfig = elementSettings[col] || {}
                                  const labelPos = elConfig.labelPos || 'top'
                                  const alignClass = elConfig.align === 'center' ? 'text-center items-center' : elConfig.align === 'right' ? 'text-right items-end' : 'text-left items-start'
                                  const renderType = elConfig.renderType || columnStyles[col] || "text"
                                  
                                  // Simplified wrapper matching the visual builder styles for simplicity inside grid
                                  return (
                                     <div key={col} className={`flex ${labelPos === 'inline' ? 'flex-row items-center gap-3' : 'flex-col gap-1.5'} bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm ${alignClass}`}>
                                        {labelPos !== 'hidden' && (
                                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 dark:text-indigo-300 font-bold shrink-0">{col}</span>
                                        )}
                                        <span className={`text-slate-700 dark:text-slate-300 text-sm truncate font-mono ${renderType === 'badge' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 font-bold' : ''}`} title={renderVal}>{renderVal}</span>
                                     </div>
                                  )
                               })}
                             </div>

                             {drawerLine.filter((col: string) => !col.startsWith("__action_") && Array.isArray(row[col])).map((col: string) => {
                                const arr = row[col] as any[]
                                if (arr.length === 0) return null
                                const innerCols = Object.keys(arr[0]).filter(k => typeof arr[0][k] !== "object")
                                return (
                                   <div key={col} className="mt-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
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
                             const isLoading = actionLoading === `${action.name}-${rowId}`
                             return (
                                <button
                                   key={`main-act-${idx}`}
                                   disabled={isLoading}
                                   onClick={(e) => { e.stopPropagation(); executeAction(action, row) }}
                                   className="px-2 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-300 dark:border-slate-700 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                >
                                   {isLoading ? <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : null}
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
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
                              <Terminal className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Detail Inspector (Key: {rowId})
                            </h4>
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
                                        const isLoading = actionLoading === `${action.name}-${rowId}`;
                                        return (
                                           <button 
                                             key={idx} 
                                             disabled={isLoading}
                                             onClick={() => executeAction(action, row)} 
                                             className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shadow disabled:opacity-50 transition-colors flex items-center gap-2"
                                           >
                                              {isLoading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : null}
                                              <Terminal className="w-3 h-3 opacity-50" /> {action.name}
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

    </div>
  )
}
