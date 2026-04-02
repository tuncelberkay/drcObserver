"use client"

import { useState, useMemo, useEffect } from "react"
import * as Icons from "lucide-react"
import VisualRecordBuilder from "./VisualRecordBuilder"
import { bindWidgetDataSource } from "@/app/actions/cms"
import { WidgetRegistry } from "./WidgetRegistry"

const AVAILABLE_WIDGETS = [
  { key: "OBSERVABILITY_GRID", name: "Responsive Drag Grid", iconName: "Layout", desc: "A customizable matrix of charts." },
  { key: "MASTER_DETAIL_TABLE", name: "Data Table", iconName: "Table", desc: "A deep-dive data table with live logs." },
  { key: "STAT_CARD", name: "KPI Stat Card", iconName: "Hash", desc: "A singular crucial metric indicator." },
  { key: "BAR_CHART", name: "Vertical Bar Matrix", iconName: "BarChart3", desc: "Comparative scale dataset charts." },
  { key: "PIE_CHART", name: "Distribution Pie", iconName: "PieChart", desc: "Visual dataset composition ring." },
  { key: "LINE_GRAPH", name: "Time-Series Flow", iconName: "LineChart", desc: "Historical tracking datasets." }
]

export function ActiveWidgetEditor({ widget, sources, onClose }: { widget: any, sources: any[], onClose: () => void }) {
  const [isInjecting, setIsInjecting] = useState(false)
  
  const widgetMeta = AVAILABLE_WIDGETS.find(w => w.key === widget.componentKey) || { key: widget.componentKey, name: widget.componentKey, desc: "Custom Config", iconName: "Box" }
  const Icon = (Icons as any)[widgetMeta.iconName] || Icons.Box

  const existingConfig = useMemo(() => {
    try { return JSON.parse(widget.configJson || "{}") } catch { return {} }
  }, [widget.configJson])

  const initialSources = widget.dataSources?.map((ds: any) => ds.id) || []

  const [selectedSources, setSelectedSources] = useState<string[]>(initialSources)
  const [dataQuery, setDataQuery] = useState(widget.dataQuery || "ds.flat()")

  const [groupBy, setGroupBy] = useState(existingConfig.groupBy || "")
  const [aggType, setAggType] = useState(existingConfig.aggType || "COUNT")
  const [configTitle, setConfigTitle] = useState(existingConfig.title || `${widgetMeta.name} Visual`)
  const [showTitle, setShowTitle] = useState(existingConfig.showTitle ?? true)
  const [showSubText, setShowSubText] = useState(existingConfig.showSubText ?? false)
  const [subText, setSubText] = useState(existingConfig.subText ?? "")
  
  const [xAxisKey, setXAxisKey] = useState(existingConfig.xAxisKey || "name")
  const [dataKey, setDataKey] = useState(existingConfig.dataKey || "value")
  const [metricLabel, setMetricLabel] = useState(existingConfig.metricLabel || "Metric")

  const [tablePrimaryKey, setTablePrimaryKey] = useState(existingConfig.tablePrimaryKey || "id")
  const [parentCols, setParentCols] = useState(existingConfig.parentCols || "")
  const [childCols, setChildCols] = useState(existingConfig.childCols || "")
  const [customColors, setCustomColors] = useState<string[]>(existingConfig.colors || [])
  const [customActions, setCustomActions] = useState<any[]>(existingConfig.customActions || [])
  const [columnStyles, setColumnStyles] = useState<Record<string, string>>(existingConfig.columnStyles || {})
  const [lineSettings, setLineSettings] = useState<Record<string, any>>(existingConfig.lineSettings || {})
  const [elementSettings, setElementSettings] = useState<Record<string, any>>(existingConfig.elementSettings || {})
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null)
  
  const [layoutLines, setLayoutLines] = useState<any[]>(existingConfig.layoutLines || [
      { id: "line-1", name: "Main Record Line 1", cols: (existingConfig.parentCols || "").split(",").map((c: string) => c.trim()).filter(Boolean) },
      existingConfig.childCols ? { id: "drawer", name: "Embedded Detail Drawer", cols: existingConfig.childCols.split(",").map((c: string) => c.trim()).filter(Boolean) } : null
  ].filter(Boolean))


  const [gridW, setGridW] = useState<number>(widget.w ?? 6)
  const [gridH, setGridH] = useState<number>(widget.h ?? 3)

  const [previewRawJson, setPreviewRawJson] = useState<string | null>(null)
  const [previewDataArray, setPreviewDataArray] = useState<any[] | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const handleInject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsInjecting(true)

    try {
      await bindWidgetDataSource(
        widget.id, 
        selectedSources,
        dataQuery,
        JSON.stringify({ groupBy, aggType, title: configTitle, showTitle, showSubText, subText, xAxisKey, dataKey, metricLabel, tablePrimaryKey, parentCols, childCols, colors: customColors.length > 0 ? customColors : undefined, layoutLines, customActions, columnStyles, lineSettings, elementSettings }),
        widget.x ?? 0,
        widget.y ?? 999,
        gridW,
        gridH
      )
      onClose()
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

  useEffect(() => {
    const tid = setTimeout(() => {
      handlePreview()
    }, 600)
    return () => clearTimeout(tid)
  }, [selectedSources, dataQuery, groupBy, aggType])


  const ChartComponent = WidgetRegistry[widget.componentKey]

  const transientConfig = useMemo(() => ({
    title: configTitle,
    showTitle,
    showSubText,
    subText,
    groupBy,
    aggType,
    xAxisKey,
    dataKey,
    metricLabel,
    tablePrimaryKey,
    parentCols,
    childCols,
    colors: customColors.length > 0 ? customColors : undefined,
    columnStyles,
    customActions,
    layoutLines,
    lineSettings,
    elementSettings
  }), [configTitle, showTitle, showSubText, subText, groupBy, aggType, xAxisKey, dataKey, metricLabel, tablePrimaryKey, parentCols, childCols, customColors, customActions, columnStyles, layoutLines, lineSettings, elementSettings])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full h-full lg:w-[95vw] lg:h-[95vh] shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-shrink-0 items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] dark:shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Grafana-Style Configuration</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Modifying active visual matrix for {widgetMeta.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-rose-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* Left Control Panel */}
          <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 z-10 shadow-[5px_0_20px_rgba(0,0,0,0.05)] dark:shadow-[5px_0_20px_rgba(0,0,0,0.2)]">
            <form onSubmit={handleInject} id="inject-form" className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50/30 dark:bg-transparent">
              
              {/* Step 1: Stateful Data selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Icons.Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Database Mappings
                    <span className="ml-auto text-[9px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/30">M-to-N Enabled</span>
                </label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {sources.map((s: any, index: number) => {
                    const isActive = selectedSources.includes(s.id)
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => toggleSource(s.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 dark:border-indigo-500/50 shadow-[inset_0_0_10px_rgba(99,102,241,0.05)] dark:shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
                      >
                        <div>
                          <span className={`block font-bold text-sm ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{s.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded uppercase mt-1 inline-block border border-slate-100 dark:border-slate-800">{s.type} (ds[{index}])</span>
                        </div>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-500 dark:border-indigo-400 text-white dark:text-slate-950' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'}`}>
                          {isActive && <Icons.Check className="w-3.5 h-3.5 font-bold" />}
                        </div>
                      </div>
                    )
                  })}
                  {sources.length === 0 && <p className="text-sm text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center">No Data Sources Available</p>}
                </div>
              </div>

              {selectedSources.length > 0 && (
                <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-8">
                  {/* Step 2: Post Processing Block */}
                  <div className="p-5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                          <Icons.Filter className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Auto-Aggregator
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed">Optional. Visually group and aggregate data natively instead of writing Javascript arrays.</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Group By Identifier</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={groupBy}
                              onChange={e => {
                                setGroupBy(e.target.value)
                                setPreviewRawJson(null)
                                setPreviewDataArray(null)
                              }}
                              className="block w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm focus:ring-1 focus:ring-orange-500 transition-shadow outline-none" 
                              placeholder="e.g. syncProgress or status" 
                            />
                            <Icons.Table className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Operation Math</label>
                          <div className="relative">
                            <select 
                              value={aggType}
                              onChange={e => {
                                setAggType(e.target.value)
                                setPreviewRawJson(null)
                                setPreviewDataArray(null)
                              }}
                              className="block w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm focus:ring-1 focus:ring-orange-500 transition-shadow outline-none appearance-none" 
                            >
                              <option value="COUNT">Count Items</option>
                              <option value="SUM">Sum Array Columns</option>
                              <option value="AVG">Average Target</option>
                            </select>
                            <Icons.PieChart className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 dark:text-slate-500">
                                <Icons.ChevronDown className="w-4 h-4" />
                            </div>
                            
                            {/* Explicit Grid Sizing Parameters */}
                            <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                               <div className="col-span-2 mb-1">
                                  <label className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                     <Icons.LayoutGrid className="w-3.5 h-3.5" /> Canvas Allocation Size
                                  </label>
                               </div>
                               <div>
                                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 focus-within:text-sky-600 dark:focus-within:text-sky-400 transition-colors">Width (Span)</label>
                                  <select value={gridW} onChange={e => setGridW(Number(e.target.value))} className="block w-full px-2 py-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs focus:ring-1 focus:ring-sky-500 outline-none text-center font-mono appearance-none">
                                    <option value={12}>Full Span (100%)</option>
                                    <option value={8}>Two-Thirds (66%)</option>
                                    <option value={6}>Half Span (50%)</option>
                                    <option value={4}>One-Third (33%)</option>
                                    <option value={3}>Quarter (25%)</option>
                                    <option value={2}>Compact (16%)</option>
                                  </select>
                               </div>
                               <div>
                                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 focus-within:text-sky-600 dark:focus-within:text-sky-400 transition-colors">Height (Rows)</label>
                                  <select value={gridH} onChange={e => setGridH(Number(e.target.value))} className="block w-full px-2 py-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs focus:ring-1 focus:ring-sky-500 outline-none text-center font-mono appearance-none">
                                    <option value={1}>Compact (1 Row)</option>
                                    <option value={2}>Standard (2 Rows)</option>
                                    <option value={3}>Tall (3 Rows)</option>
                                    <option value={4}>Extra Tall (4 Rows)</option>
                                    <option value={5}>Massive (5 Rows)</option>
                                    <option value={6}>Giant (6 Rows)</option>
                                    <option value={10}>Full Page (10 Rows)</option>
                                    <option value={12}>Max Page (12 Rows)</option>
                                  </select>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>

                  {/* Step 3: Math Matrix Block */}
                  <div>
                    <label htmlFor="dataQuery" className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                      <Icons.Code className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Matrix Reducer Algorithm
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-500 mb-3 leading-relaxed">The ultimate Node sandbox engine. Fuse Multi-Source arrays utilizing Javascript natively: <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">ds.flat()</code>.</p>
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
                      className="block w-full px-4 py-3 rounded-xl bg-slate-800 dark:bg-black border border-slate-700 dark:border-slate-800 text-emerald-400 dark:text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm shadow-inner dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] resize-none" 
                      placeholder="ds.flat()" 
                    />
                    
                    <div className="mt-4">
                        <button type="button" onClick={handlePreview} disabled={isPreviewing || !dataQuery} className="w-full py-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-50 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/50 shadow-sm custom-shadow-transition">
                          {isPreviewing ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Play className="w-4 h-4" />}
                          {isPreviewing ? "Evaluating Sandbox..." : "Render Live Canvas"}
                        </button>
                    </div>
                  </div>

                  {/* Step 4: Visual Adjustments */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                      <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                        <Icons.Paintbrush className="w-4 h-4 text-sky-600 dark:text-sky-400" /> UI Configurations
                      </label>
                      <div>
                         <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Display Title</label>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                               <input 
                                  type="checkbox" 
                                  checked={showTitle} 
                                  onChange={e => setShowTitle(e.target.checked)}
                                  className="rounded text-sky-500 focus:ring-sky-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                               />
                               <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Show Title</span>
                            </label>
                         </div>
                        <input 
                          type="text" 
                          value={configTitle}
                          disabled={!showTitle}
                          onChange={e => setConfigTitle(e.target.value)}
                          className="block w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm focus:ring-1 focus:ring-sky-500 outline-none disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900" 
                        />
                      </div>
                      <div>
                         <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Summary Template</label>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                               <input 
                                  type="checkbox" 
                                  checked={showSubText} 
                                  onChange={e => setShowSubText(e.target.checked)}
                                  className="rounded text-sky-500 focus:ring-sky-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                               />
                               <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Show Summary</span>
                            </label>
                         </div>
                         <input 
                           type="text" 
                           value={subText}
                           disabled={!showSubText}
                           onChange={e => setSubText(e.target.value)}
                           placeholder="{name} / Total: {value} / {total}"
                           className="block w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm focus:ring-1 focus:ring-sky-500 outline-none disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900 font-mono text-xs" 
                         />
                         <p className="mt-1.5 text-[10px] text-slate-500">Variables automatically map dynamic math: <code className="text-sky-500 font-bold">&#123;name&#125;</code>, <code className="text-sky-500 font-bold">&#123;value&#125;</code>, <code className="text-sky-500 font-bold">&#123;total&#125;</code>.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {widget.componentKey === "MASTER_DETAIL_TABLE" ? (
                           <>
                             <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Primary ID Key</label>
                                <input 
                                  type="text" 
                                  value={tablePrimaryKey}
                                  onChange={e => setTablePrimaryKey(e.target.value)}
                                  className="block w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                  placeholder="id"
                                />
                             </div>
                              <div className="col-span-2">
                                 {/* Builder moved to right canvas */}
                                <div className="col-span-2 hidden">
                                  {/* Action Configuration moved to right canvas sandbox */}
                               </div>
                             </div>
                           </>
                        ) : (
                           <>
                             <div>
                               <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">X-Axis Label Key</label>
                               <input 
                                 type="text" 
                                 value={xAxisKey}
                                 onChange={e => setXAxisKey(e.target.value)}
                                 className="block w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                 placeholder="name"
                               />
                             </div>
                             <div>
                               <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Y-Axis Value Key</label>
                               <input 
                                 type="text" 
                                 value={dataKey}
                                 onChange={e => setDataKey(e.target.value)}
                                 className="block w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                 placeholder="value"
                               />
                             </div>
                             <div className="col-span-2">
                               <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tooltip Metric Name</label>
                               <input 
                                 type="text" 
                                 value={metricLabel}
                                 onChange={e => setMetricLabel(e.target.value)}
                                 className="block w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs focus:ring-1 focus:ring-sky-500 outline-none" 
                                 placeholder="e.g. Total Errors"
                               />
                             </div>
                           </>
                        )}
                      </div>
                  </div>

                  {widget.componentKey !== "MASTER_DETAIL_TABLE" && widget.componentKey !== "STAT_CARD" && previewDataArray && previewDataArray.length > 0 && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-bottom-2">
                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                          <Icons.Palette className="w-4 h-4 text-pink-500 dark:text-pink-400" /> Series Color Mapping
                        </label>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">Custom explicit colors assigned sequentially by dimension indices.</p>
                        
                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
                          {previewDataArray.map((row, index) => {
                             const label = row[xAxisKey] || row[configTitle ? "name" : "metric"] || `D-${index}`
                             const fallbackColors = ['#3b82f6', '#e5e7eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                             const colorVal = customColors[index] || fallbackColors[index % fallbackColors.length]
                             
                             return (
                               <div key={index} className="flex flex-col items-center gap-1">
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate w-full text-center tracking-tighter" title={String(label)}>
                                    {String(label).substring(0, 4)}
                                  </label>
                                  <input 
                                    type="color"
                                    value={colorVal}
                                    onChange={e => {
                                       const updated = [...customColors]
                                       updated[index] = e.target.value
                                       // Pad undefined preceding array slots safely with fallback palette
                                       for (let i = 0; i < index; i++) {
                                         if (!updated[i]) updated[i] = fallbackColors[i % fallbackColors.length]
                                       }
                                       setCustomColors(updated)
                                    }}
                                    className="w-8 h-8 rounded shrink-0 cursor-pointer overflow-hidden outline-none bg-transparent border-none p-0"
                                    style={{ WebkitAppearance: 'none' }}
                                  />
                               </div>
                             )
                          })}
                        </div>
                    </div>
                  )}

                </div>
              )}

              {/* Variable Dictionary Injector Tracker */}
              {previewDataArray && previewDataArray.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 shadow-inner mt-6">
                   <div className="flex items-center gap-2 mb-3">
                      <Icons.Braces className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Available Row Variables</h4>
                   </div>
                   <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 mb-3 leading-relaxed">
                     You can wrap the following data columns in bracket notation (e.g. <code>&#123;id&#125;</code>) in your titles, tooltips, or action templates!
                   </p>
                   <div className="flex flex-wrap gap-1.5">
                      {Object.keys(previewDataArray[0])
                        .filter(k => typeof previewDataArray[0][k] !== "object")
                        .map(key => (
                          <span key={key} className="px-2 py-1 bg-white dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/50 rounded shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-none text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold tracking-tight">
                             &#123;{key}&#125;
                          </span>
                      ))}
                   </div>
                </div>
              )}
            </form>
            
            {/* Left Panel Footer */}
            <div className="p-6 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md z-10 flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2.5 flex-1 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button form="inject-form" disabled={isInjecting || selectedSources.length === 0 || !dataQuery} type="submit" className="px-4 flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)] dark:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 border border-transparent dark:border-indigo-400/30">
                {isInjecting ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
                {isInjecting ? "Binding..." : "Update Configuration"}
              </button>
            </div>
          </div>

          {/* Right Canvas Panel */}
          <div className="flex-1 bg-slate-100 dark:bg-black relative flex flex-col overflow-hidden">
            {/* Canvas Background Pattern */}
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
            
            {!previewDataArray && !previewRawJson && (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                  <Icons.Workflow className="w-16 h-16 text-slate-300 dark:text-slate-800" strokeWidth={1} />
                  <p className="text-slate-500 font-medium">Edit parameters & Press Render Canvas</p>
                </div>
            )}

            {previewDataArray && ChartComponent && (
                <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative z-10 animate-in zoom-in-[0.98] duration-500">
                  <div className={`w-full ring-1 ring-slate-200 dark:ring-slate-800/50 rounded-2xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden bg-white dark:bg-[#0b1120] ${widget.componentKey === "MASTER_DETAIL_TABLE" ? 'max-w-[1200px] w-[95%]' : 'max-w-4xl'}`}>
                    {/* Fake Browser TopBar */}
                    <div className="bg-slate-50 dark:bg-slate-950 flex items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800 gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400/80 dark:bg-red-500/80"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-400/80 dark:bg-amber-500/80"></div>
                          <div className="w-3 h-3 rounded-full bg-emerald-400/80 dark:bg-emerald-500/80"></div>
                        </div>
                        <div className="flex-1 text-center font-mono text-[10px] text-slate-500 dark:text-slate-600 font-bold uppercase tracking-widest">Live Execution Sandbox</div>
                    </div>
                    {/* Actual Component Mount */}
                     <div className={`p-6 w-full flex flex-col ${widget.componentKey === "MASTER_DETAIL_TABLE" ? 'h-[600px] lg:h-[750px] p-0' : 'h-[400px]'}`}>
                        {widget.componentKey === "MASTER_DETAIL_TABLE" ? (
                           <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
                             <VisualRecordBuilder 
                                layoutLines={layoutLines}
                                customActions={customActions}
                                columnStyles={columnStyles}
                                lineSettings={lineSettings}
                                elementSettings={elementSettings}
                                previewDataArray={previewDataArray}
                                onChange={(newState) => {
                                   if (newState.layoutLines) setLayoutLines(newState.layoutLines)
                                   if (newState.columnStyles) setColumnStyles(newState.columnStyles)
                                   if (newState.lineSettings) setLineSettings(newState.lineSettings)
                                   if (newState.elementSettings) setElementSettings(newState.elementSettings)
                                   if (newState.customActions) setCustomActions(newState.customActions)
                                   
                                   // Sync legacy tracking for backward compatibility
                                   if (newState.layoutLines) {
                                      const pCols = newState.layoutLines.find((l: any) => l.id === "line-1")?.cols.join(", ") || ""
                                      const cCols = newState.layoutLines.find((l: any) => l.id === "drawer")?.cols.join(", ") || ""
                                      setParentCols(pCols)
                                      setChildCols(cCols)
                                   }
                                }}
                              />
                            </div>
                        ) : (
                           <div className="w-full h-full p-4 overflow-x-auto min-h-[300px]">
                               <ChartComponent
                                   widget={widget}
                                   config={transientConfig}
                                   previewData={previewDataArray}
                               />
                           </div>
                        )}
                     </div>
                  </div>
                </div>
            )}

            {previewRawJson && (
              <div className="h-64 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-black/90 backdrop-blur-sm relative z-20 flex flex-col animate-in slide-in-from-bottom-5">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <Icons.TerminalSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Data Processor Result Payload (JSON)
                  <span className="ml-auto text-[10px] font-mono bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-transparent">{previewDataArray?.length || 0} Nodes Calculated</span>
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  <pre className="text-[12px] font-mono leading-relaxed text-indigo-800 dark:text-indigo-300">
                    {previewRawJson}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
