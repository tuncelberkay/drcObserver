"use client"

import React, { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronRight, ChevronLeft, Terminal, Search, Filter } from "lucide-react"

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

  const parentCols = parentColsRaw.split(",").map((c: string) => c.trim()).filter(Boolean)
  const childCols = childColsRaw.split(",").map((c: string) => c.trim()).filter(Boolean)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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
    
    async function initData() {
      setLoading(true)
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
        setLoading(false)
      }
    }

    initData()
    // Constant polling fallback map
    intervalId = setInterval(initData, 10000)

    return () => clearInterval(intervalId)
  }, [widget?.id, previewData])

  if (loading) return <div className="w-full h-full flex items-center justify-center text-center text-slate-400 animate-pulse font-mono tracking-widest text-xs">AWAITING MATRIX DATA...</div>

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
         <div className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono tracking-widest uppercase flex items-center gap-2">
            <Search className="w-3 h-3 text-slate-500" />
            {metrics.length} Rows Synced
         </div>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <th className="p-4 font-semibold w-12 text-center">+/-</th>
              {parentCols.map((col: string) => (
                <th key={col} className="p-4 font-semibold whitespace-nowrap">{col}</th>
              ))}
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
                       if (typeof val === "string") {
                         const lower = val.toLowerCase()
                         if (['running', 'online', 'ok', 'active', 'success'].includes(lower)) colorStyle = "text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 w-fit font-semibold"
                         if (['offline', 'down', 'error', 'failed', 'critical'].includes(lower)) colorStyle = "text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-md border border-rose-400/20 w-fit font-semibold"
                         if (['warning', 'pending', 'syncing'].includes(lower)) colorStyle = "text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 w-fit font-semibold"
                       }

                       return (
                         <td key={col} className="p-4 text-sm whitespace-nowrap">
                            <div className={colorStyle}>{text}</div>
                         </td>
                       )
                    })}
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-indigo-200 dark:border-indigo-500/20">
                      <td colSpan={parentCols.length + 1} className="p-0">
                        <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-4 col-span-full">
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
                              <Terminal className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Detail Inspector (Key: {rowId})
                            </h4>
                            <div className="bg-white dark:bg-slate-900/50 rounded-xl p-6 font-mono text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 shadow-inner">
                               {childCols.map((col: string) => {
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
                               {childCols.length === 0 && <p className="text-slate-500 italic text-xs">No detail columns specified in Schema.</p>}
                            </div>
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
                    <option value={10}>10 Rows</option>
                    <option value={50}>50 Rows</option>
                    <option value={100}>100 Rows</option>
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
