"use client"

import { useState, useMemo } from "react"
import * as Icons from "lucide-react"
import { addWidgetToPage, bindWidgetDataSource } from "@/app/actions/cms"
import { WidgetRegistry } from "./WidgetRegistry"

export function WidgetStoreItem({ widget, pageId, sources }: { widget: any, pageId: string, sources: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isInjecting, setIsInjecting] = useState(false)
  const getDefaultPreset = (key: string, defaultName: string) => {
    switch (key) {
      case "PIE_CHART":
        return { groupBy: "agentStatus", aggType: "COUNT", dataQuery: "ds.flat()", title: "Agent Status Distribution", xAxisKey: "name", dataKey: "value", metricLabel: "Total Agents", tablePrimaryKey: "id", parentCols: "", childCols: "", gridX: 0, gridY: 0, gridW: 4, gridH: 3 }
      case "BAR_CHART":
        return { groupBy: "os", aggType: "COUNT", dataQuery: "ds.flat()", title: "OS Platform Metrics", xAxisKey: "name", dataKey: "value", metricLabel: "Total Servers", tablePrimaryKey: "id", parentCols: "", childCols: "", gridX: 4, gridY: 0, gridW: 6, gridH: 3 }
      case "LINE_GRAPH":
        return { groupBy: "", aggType: "SUM", dataQuery: "ds.flat().map(r => ({ time: new Date(r.updatedAt || Date.now()).toLocaleTimeString(), progress: r.syncProgress }))", title: "Live Sync Timeline", xAxisKey: "time", dataKey: "progress", metricLabel: "Progress %", tablePrimaryKey: "id", parentCols: "", childCols: "", gridX: 0, gridY: 3, gridW: 10, gridH: 4 }
      case "STAT_CARD":
        return { groupBy: "agentStatus", aggType: "COUNT", dataQuery: "ds.flat().filter(d => d.agentStatus === 'Offline')", title: "Offline Agents", xAxisKey: "name", dataKey: "value", metricLabel: "Count", tablePrimaryKey: "id", parentCols: "", childCols: "", gridX: 10, gridY: 0, gridW: 2, gridH: 1 }
      case "MASTER_DETAIL_TABLE":
        return { groupBy: "", aggType: "COUNT", dataQuery: "ds.flat()", title: "Telemetry Datatable", xAxisKey: "name", dataKey: "value", metricLabel: "Metric", tablePrimaryKey: "id", parentCols: "hostname, os, agentStatus", childCols: "appOwner, techStack, syncProgress, updatedAt", gridX: 0, gridY: 7, gridW: 12, gridH: 5 }
      default:
        return { groupBy: "", aggType: "COUNT", dataQuery: "ds.flat()", title: `${defaultName} Visual`, xAxisKey: "name", dataKey: "value", metricLabel: "Metric", tablePrimaryKey: "id", parentCols: "", childCols: "", gridX: 0, gridY: 0, gridW: 6, gridH: 4 }
    }
  }

  const preset = useMemo(() => getDefaultPreset(widget.key, widget.name), [widget.key, widget.name])
  const Icon = (Icons as any)[widget.iconName] || Icons.Box

  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [dataQuery, setDataQuery] = useState(preset.dataQuery)

  const [groupBy, setGroupBy] = useState(preset.groupBy)
  const [aggType, setAggType] = useState(preset.aggType)
  const [configTitle, setConfigTitle] = useState(preset.title)
  
  const [xAxisKey, setXAxisKey] = useState(preset.xAxisKey)
  const [dataKey, setDataKey] = useState(preset.dataKey)
  const [metricLabel, setMetricLabel] = useState(preset.metricLabel)
  
  const [tablePrimaryKey, setTablePrimaryKey] = useState(preset.tablePrimaryKey)
  const [parentCols, setParentCols] = useState(preset.parentCols)
  const [childCols, setChildCols] = useState(preset.childCols)
  
  // Matrix Coordinates
  const [gridX, setGridX] = useState(preset.gridX)
  const [gridY, setGridY] = useState(preset.gridY)
  const [gridW, setGridW] = useState(preset.gridW)
  const [gridH, setGridH] = useState(preset.gridH)

  const getMockPreviewData = (key: string) => {
    switch(key) {
      case "PIE_CHART": return [{ name: "Running", value: 45 }, { name: "Offline", value: 12 }, { name: "Pending", value: 5 }]
      case "BAR_CHART": return [{ name: "RHEL 9", value: 25 }, { name: "Ubuntu 22", value: 14 }, { name: "Windows", value: 8 }]
      case "LINE_GRAPH": return [{ time: "10:00", progress: 40 }, { time: "10:05", progress: 75 }, { time: "10:10", progress: 95 }]
      case "STAT_CARD": return [{ name: "Offline Agents", value: 12 }]
      case "MASTER_DETAIL_TABLE": return [
        { id: "mock-1", hostname: "db-prod-01", os: "RHEL 9", agentStatus: "Running", appOwner: "CoreDB", techStack: "PostgreSQL", syncProgress: 100, updatedAt: new Date().toISOString() },
        { id: "mock-2", hostname: "app-prod-01", os: "Ubuntu", agentStatus: "Running", appOwner: "Frontend", techStack: "Node.js", syncProgress: 55, updatedAt: new Date().toISOString() },
        { id: "mock-3", hostname: "db-archive", os: "RHEL 8", agentStatus: "Offline", appOwner: "Analytics", techStack: "Oracle", syncProgress: 4, updatedAt: new Date().toISOString() },
      ]
      default: return [{ name: "Metric 1", value: 10 }]
    }
  }

  const [previewRawJson, setPreviewRawJson] = useState<string | null>(null)
  const [previewDataArray, setPreviewDataArray] = useState<any[] | null>(() => getMockPreviewData(widget.key))
  const [isPreviewing, setIsPreviewing] = useState(false)

  const handleInject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsInjecting(true)

    try {
      const res = await addWidgetToPage(pageId, widget.key, gridX, gridY, gridW, gridH)
      if (res.widgetId) {
        await bindWidgetDataSource(
          res.widgetId, 
          selectedSources,
          dataQuery,
          JSON.stringify({ groupBy, aggType, title: configTitle, xAxisKey, dataKey, metricLabel, tablePrimaryKey, parentCols, childCols })
        )
      }
      setIsOpen(false)
      setSelectedSources([])
      setDataQuery("")
    } finally {
      setIsInjecting(false)
    }
  }

  const toggleSource = (id: string) => {
    setSelectedSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
    setPreviewRawJson(null)
    setPreviewDataArray(null)
  }

  const handlePreview = async () => {
    setIsPreviewing(true)
    setPreviewRawJson(null)
    setPreviewDataArray(null)
    try {
      const res = await fetch("/api/cms/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceIds: selectedSources, dataQuery, configJsonStr: JSON.stringify({ groupBy, aggType }) })
      })
      const json = await res.json()
      setPreviewRawJson(JSON.stringify(json, null, 2))
      if (json.data && !json.error) {
         setPreviewDataArray(Array.isArray(json.data) ? json.data : [json.data])
      }
    } catch (err: any) {
      setPreviewRawJson(JSON.stringify({ error: err.message }, null, 2))
    } finally {
      setIsPreviewing(false)
    }
  }

  const ChartComponent = WidgetRegistry[widget.key]
  
  const transientWidget = useMemo(() => ({
    id: "preview-id",
    componentKey: widget.key,
    name: widget.name,
    desc: widget.desc
  }), [widget])

  const transientConfig = useMemo(() => ({
    title: configTitle,
    groupBy,
    aggType,
    xAxisKey,
    dataKey,
    metricLabel,
    tablePrimaryKey,
    parentCols,
    childCols
  }), [configTitle, groupBy, aggType, xAxisKey, dataKey, metricLabel, tablePrimaryKey, parentCols, childCols])

  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500/30 transition-all cursor-pointer group">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-200">{widget.name}</h4>
          <p className="text-xs text-slate-500">{widget.desc}</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-500 text-slate-300 hover:text-white flex flex-shrink-0 items-center justify-center transition-colors"
        >
          <Icons.Plus className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full h-full lg:w-[95vw] lg:h-[95vh] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top Navigation Bar */}
            <div className="flex flex-shrink-0 items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 leading-tight">Grafana-Style Configuration</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Configuring visual matrix for {widget.name}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-colors">
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
              {/* Left Control Panel */}
              <div className="w-full lg:w-[420px] bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 z-10 shadow-[5px_0_20px_rgba(0,0,0,0.2)]">
                <form onSubmit={handleInject} id="inject-form" className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  
                  {/* Step 1: Stateful Data selection */}
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                       <Icons.Database className="w-4 h-4 text-indigo-400" /> Database Mappings
                       <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-500/30">M-to-N Enabled</span>
                    </label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {sources.map((s, index) => {
                        const isActive = selectedSources.includes(s.id)
                        return (
                          <div 
                            key={s.id} 
                            onClick={() => toggleSource(s.id)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                          >
                            <div>
                              <span className={`block font-bold text-sm ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>{s.name}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded uppercase mt-1 inline-block border border-slate-800">{s.type} (ds[{index}])</span>
                            </div>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-indigo-500 border-indigo-400 text-slate-950' : 'border-slate-700 bg-slate-900'}`}>
                              {isActive && <Icons.Check className="w-3.5 h-3.5 font-bold" />}
                            </div>
                          </div>
                        )
                      })}
                      {sources.length === 0 && <p className="text-sm text-slate-500 italic p-4 bg-slate-950 border border-slate-800 rounded-lg text-center">No Data Sources Available</p>}
                    </div>
                  </div>

                  {selectedSources.length > 0 && (
                    <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-8">
                      {/* Step 2: Post Processing Block */}
                      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                         <div>
                           <label className="block text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
                              <Icons.Filter className="w-4 h-4 text-orange-400" /> Auto-Aggregator
                           </label>
                           <p className="text-[11px] text-slate-500 leading-relaxed">Optional. Visually group and aggregate data natively instead of writing Javascript arrays.</p>
                         </div>
                         
                         <div className="space-y-4">
                           <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Group By Identifier</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  value={groupBy}
                                  onChange={e => {
                                    setGroupBy(e.target.value)
                                    setPreviewRawJson(null)
                                    setPreviewDataArray(null)
                                  }}
                                  className="block w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:ring-1 focus:ring-orange-500 transition-shadow outline-none" 
                                  placeholder="e.g. syncProgress or status" 
                                />
                                <Icons.Table className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Operation Math</label>
                              <div className="relative">
                                <select 
                                  value={aggType}
                                  onChange={e => {
                                    setAggType(e.target.value)
                                    setPreviewRawJson(null)
                                    setPreviewDataArray(null)
                                  }}
                                  className="block w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:ring-1 focus:ring-orange-500 transition-shadow outline-none appearance-none" 
                                >
                                  <option value="COUNT">Count Items</option>
                                  <option value="SUM">Sum Array Columns</option>
                                  <option value="AVG">Average Target</option>
                                </select>
                                <Icons.PieChart className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                   <Icons.ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                           </div>
                         </div>
                      </div>

                      {/* Step 3: Math Matrix Block */}
                      <div>
                        <label htmlFor="dataQuery" className="block text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                          <Icons.Code className="w-4 h-4 text-emerald-400" /> Matrix Reducer Algorithm
                        </label>
                        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">The ultimate Node sandbox engine. Fuse Multi-Source arrays utilizing Javascript natively: <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800 text-emerald-400">ds.flat()</code>.</p>
                        <textarea 
                          required 
                          rows={3}
                          name="dataQuery" 
                          id="dataQuery" 
                          value={dataQuery}
                          onChange={e => {
                            setDataQuery(e.target.value)
                            setPreviewRawJson(null)
                            setPreviewDataArray(null)
                          }}
                          className="block w-full px-4 py-3 rounded-xl bg-black border border-slate-800 text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] resize-none" 
                          placeholder="ds.flat()" 
                        />
                        
                        <div className="mt-4">
                           <button type="button" onClick={handlePreview} disabled={isPreviewing || !dataQuery} className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-emerald-500/30 hover:border-emerald-500/50">
                             {isPreviewing ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Play className="w-4 h-4" />}
                             {isPreviewing ? "Evaluating Sandbox..." : "Render Live Canvas"}
                           </button>
                        </div>
                      </div>

                      {/* Step 4: Visual Adjustments */}
                      <div className="pt-6 border-t border-slate-800 space-y-4">
                         <label className="block text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
                            <Icons.Paintbrush className="w-4 h-4 text-sky-400" /> UI Configurations
                         </label>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Display Title</label>
                            <input 
                              type="text" 
                              value={configTitle}
                              onChange={e => setConfigTitle(e.target.value)}
                              className="block w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:ring-1 focus:ring-sky-500 outline-none" 
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           {widget.key === "MASTER_DETAIL_TABLE" ? (
                             <>
                               <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary ID Key</label>
                                  <input 
                                    type="text" 
                                    value={tablePrimaryKey}
                                    onChange={e => setTablePrimaryKey(e.target.value)}
                                    className="block w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                    placeholder="id"
                                  />
                               </div>
                               <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Parent Row Columns (Comma separated)</label>
                                  <input 
                                    type="text" 
                                    value={parentCols}
                                    onChange={e => setParentCols(e.target.value)}
                                    className="block w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                    placeholder="hostname, status"
                                  />
                               </div>
                               <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Child Detals Columns (Comma separated)</label>
                                  <input 
                                    type="text" 
                                    value={childCols}
                                    onChange={e => setChildCols(e.target.value)}
                                    className="block w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                    placeholder="owner, version"
                                  />
                               </div>
                             </>
                           ) : (
                             <>
                               <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">X-Axis Label Key</label>
                                  <input 
                                    type="text" 
                                    value={xAxisKey}
                                    onChange={e => setXAxisKey(e.target.value)}
                                    className="block w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                    placeholder="name"
                                  />
                               </div>
                               <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Y-Axis Value Key</label>
                                  <input 
                                    type="text" 
                                    value={dataKey}
                                    onChange={e => setDataKey(e.target.value)}
                                    className="block w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                    placeholder="value"
                                  />
                               </div>
                               <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tooltip Metric Name</label>
                                  <input 
                                    type="text" 
                                    value={metricLabel}
                                    onChange={e => setMetricLabel(e.target.value)}
                                    className="block w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                    placeholder="e.g. Total Errors"
                                  />
                               </div>
                             </>
                           )}
                           
                           {/* Explicit Grid Sizing Parameters */}
                           <div className="col-span-2 grid grid-cols-4 gap-4 mt-2 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                              <div className="col-span-4 mb-1">
                                 <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                    <Icons.LayoutGrid className="w-3.5 h-3.5" /> Initial Grid Coordinate Bindings
                                 </label>
                              </div>
                              <div>
                                 <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 focus-within:text-sky-400 transition-colors">X Pos (0-11)</label>
                                 <input type="number" min={0} max={11} value={gridX} onChange={e => setGridX(Number(e.target.value))} className="block w-full px-2 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:ring-1 focus:ring-sky-500 outline-none text-center font-mono" />
                              </div>
                              <div>
                                 <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 focus-within:text-sky-400 transition-colors">Y Pos (Row)</label>
                                 <input type="number" min={0} value={gridY} onChange={e => setGridY(Number(e.target.value))} className="block w-full px-2 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:ring-1 focus:ring-sky-500 outline-none text-center font-mono" />
                              </div>
                              <div>
                                 <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 focus-within:text-sky-400 transition-colors">Width (1-12)</label>
                                 <input type="number" min={1} max={12} value={gridW} onChange={e => setGridW(Number(e.target.value))} className="block w-full px-2 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:ring-1 focus:ring-sky-500 outline-none text-center font-mono" />
                              </div>
                              <div>
                                 <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 focus-within:text-sky-400 transition-colors">Height (Rows)</label>
                                 <input type="number" min={1} max={15} value={gridH} onChange={e => setGridH(Number(e.target.value))} className="block w-full px-2 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:ring-1 focus:ring-sky-500 outline-none text-center font-mono" />
                              </div>
                           </div>
                         </div>
                      </div>

                    </div>
                  )}
                </form>
                
                {/* Left Panel Footer */}
                <div className="p-6 bg-slate-950/80 border-t border-slate-800 backdrop-blur-md z-10 flex gap-3">
                  <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2.5 flex-1 rounded-lg text-sm font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button form="inject-form" disabled={isInjecting || selectedSources.length === 0 || !dataQuery} type="submit" className="px-4 flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 border border-indigo-400/30">
                    {isInjecting ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.PlusSquare className="w-4 h-4" />}
                    {isInjecting ? "Binding..." : "Save Config & Inject"}
                  </button>
                </div>
              </div>

              {/* Right Canvas Panel */}
              <div className="flex-1 bg-black relative flex flex-col overflow-hidden">
                {/* Canvas Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
                
                {/* 
                   Fallback states handled by explicit data existence.
                   The Mock Arrays now bypass this block, rendering standard visuals natively.
                */}
                {(!previewDataArray || previewDataArray.length === 0) && !previewRawJson && (
                   <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                      <Icons.Workflow className="w-16 h-16 text-slate-800" strokeWidth={1} />
                      <p className="text-slate-500 font-medium">Render Canvas to update visualization</p>
                   </div>
                )}

                {previewDataArray && ChartComponent && (
                   <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative z-10 animate-in zoom-in-[0.98] duration-500">
                     <div className="w-full max-w-4xl ring-1 ring-slate-800/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                        {/* Fake Browser TopBar */}
                        <div className="bg-slate-950 flex items-center px-4 py-2 border-b border-slate-800 gap-2">
                           <div className="flex gap-1.5">
                             <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                             <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                             <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                           </div>
                           <div className="flex-1 text-center font-mono text-[10px] text-slate-600 font-bold uppercase tracking-widest">Live Execution Sandbox</div>
                        </div>
                        {/* Actual Component Mount */}
                        <div className="bg-[#0b1120] p-6">
                           <ChartComponent widget={transientWidget} config={transientConfig} previewData={previewDataArray} />
                        </div>
                     </div>
                   </div>
                )}

                {previewRawJson && (
                  <div className="h-64 border-t border-slate-800 bg-black/90 backdrop-blur-sm relative z-20 flex flex-col animate-in slide-in-from-bottom-5">
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Icons.TerminalSquare className="w-4 h-4 text-indigo-400" /> Data Processor Result Payload (JSON)
                      <span className="ml-auto text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{previewDataArray?.length || 0} Nodes Calculated</span>
                    </div>
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                      <pre className="text-[12px] font-mono leading-relaxed text-indigo-300">
                        {previewRawJson}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
