'use client'

import React, { useState } from 'react'
import * as Icons from 'lucide-react'
import { ActionWizardModal } from './ActionWizardModal'

type VisualRecordBuilderProps = {
  layoutLines: any[]
  customActions: any[]
  columnStyles: Record<string, string>
  lineSettings: Record<string, any>
  elementSettings: Record<string, any>
  previewDataArray: any[] | null
  onChange: (updatedState: any) => void
}

export default function VisualRecordBuilder({
  layoutLines,
  customActions,
  columnStyles,
  lineSettings,
  elementSettings,
  previewDataArray,
  onChange
}: VisualRecordBuilderProps) {
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null)
  const [showActionWizard, setShowActionWizard] = useState(false)
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null)

  const firstRowObj = Array.isArray(previewDataArray?.[0]) ? previewDataArray[0][0] : previewDataArray?.[0];
  const rawKeys = firstRowObj ? Object.keys(firstRowObj).filter(k => typeof firstRowObj[k] !== "object" || firstRowObj[k] === null || Array.isArray(firstRowObj[k])) : []
  const actionKeys = customActions.map(a => `__action_${a.name}`)
  const poolKeys = [...rawKeys, ...actionKeys]
  const mockRow = firstRowObj || {}

  const updateState = (updates: any) => {
    onChange({ layoutLines, columnStyles, lineSettings, elementSettings, ...updates })
  }

  // Handle Dragging Elements into Lines
  const handleDragStart = (e: React.DragEvent, key: string, sourceLineId: string, type: 'element' | 'line') => { 
    if (type === 'element') {
      e.dataTransfer.setData("elementKey", JSON.stringify({ key, sourceLineId })) 
    } else {
      e.dataTransfer.setData("lineId", key)
    }
    e.stopPropagation()
  }

  // Handle Dropping Elements into Lines
  const handleDrop = (e: React.DragEvent, targetKey: string | null, targetLineId: string) => {
    e.preventDefault()
    const elementData = e.dataTransfer.getData("elementKey")
    const lineIdStr = e.dataTransfer.getData("lineId")

    // Handling Line Re-ordering
    if (lineIdStr && lineIdStr !== targetLineId) {
      const isDraggingDrawer = lineIdStr.startsWith("drawer")
      const isTargetDrawer = targetLineId.startsWith("drawer")
      if (isDraggingDrawer !== isTargetDrawer) return // Can't move main to drawer or drawer to main
      const linesCp = [...layoutLines]
      const srcIdx = linesCp.findIndex(l => l.id === lineIdStr)
      const tgtIdx = linesCp.findIndex(l => l.id === targetLineId)
      if (srcIdx > -1 && tgtIdx > -1) {
         const [moved] = linesCp.splice(srcIdx, 1)
         linesCp.splice(tgtIdx, 0, moved)
         updateState({ layoutLines: linesCp })
      }
      return
    }

    // Handling Element Re-ordering/Moving
    if (elementData) {
       const data = JSON.parse(elementData)
       const linesCp = [...layoutLines]
       
       let startCol = 1;
       if (e.currentTarget && (e.currentTarget as any).getBoundingClientRect) {
          const rect = (e.currentTarget as Element).getBoundingClientRect()
          const clickX = e.clientX - rect.left
          const percent = Math.max(0, Math.min(1, clickX / rect.width))
          startCol = Math.max(1, Math.min(12, Math.ceil(percent * 12)))
       }

       const srcLine = linesCp.find((l: any) => l.id === data.sourceLineId)
       if (srcLine) srcLine.cols = srcLine.cols.filter((c: string) => c !== data.key)
       
       const tgtLine = linesCp.find((l: any) => l.id === targetLineId)
       if (tgtLine) {
          if (targetKey) {
             const toIdx = tgtLine.cols.indexOf(targetKey)
             tgtLine.cols.splice(toIdx, 0, data.key)
          } else {
             tgtLine.cols.push(data.key)
          }
       }
       
       const newElementSettings = { ...elementSettings }
       if (!newElementSettings[data.key]) newElementSettings[data.key] = {}
       newElementSettings[data.key] = { ...newElementSettings[data.key], startCol }

       updateState({ layoutLines: linesCp, elementSettings: newElementSettings })
    }
  }

  const addLine = () => {
    updateState({ layoutLines: [
        ...layoutLines.filter((l: any) => !l.id.startsWith("drawer")),
        { id: `line-${Date.now()}`, name: `Record Line`, cols: [] },
        ...layoutLines.filter((l: any) => l.id.startsWith("drawer"))
     ]
    })
  }

  const addDrawer = () => {
       updateState({ layoutLines: [
          ...layoutLines,
          { id: `drawer-${Date.now()}`, name: "Embedded Detail Drawer", cols: [] }
       ]})
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 shadow-inner rounded-xl border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
           <Icons.LayoutTemplate className="w-4 h-4 text-indigo-500" />
           <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-widest">WYSIWYG Record Builder</h3>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={addDrawer} className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold border border-slate-200 dark:border-slate-700 rounded hover:border-sky-400 transition-colors">
            + Add Drawer Track
          </button>
          <button type="button" onClick={addLine} className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200 dark:border-slate-700 rounded hover:border-indigo-400 transition-colors">
            + Add Row Track
          </button>
        </div>
      </div>

      <div className="p-4 pb-56 relative min-h-[500px]">
        {/* CSS Canvas Grid Pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 w-full h-full">
        {poolKeys.length === 0 && <span className="text-xs text-slate-500 italic block mb-4 text-center">Map a dataset to visualize...</span>}

        {/* Live Canvas Area */}
        <div className="space-y-4 mb-4">
          {layoutLines.map((line: any, idx: number) => {
             const lStyle = lineSettings[line.id] || {}
             const justifyClass = lStyle.justify ? `justify-${lStyle.justify}` : 'justify-start'
             const isDrawer = line.id.startsWith('drawer')

             return (
               <div 
                  key={line.id} 
                  className={`relative group bg-white dark:bg-slate-950 p-2 rounded-lg border-2 ${isDrawer ? 'border-sky-200/50 dark:border-sky-900/30 border-dashed' : 'border-indigo-100 dark:border-indigo-900/20'}`}
                  draggable={!isDrawer}
                  onDragStart={e => handleDragStart(e, line.id, '', 'line')}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { if (e.target === e.currentTarget || (e.target as any).dataset?.dropzone === line.id) handleDrop(e, null, line.id) }}
               >
                 {/* Row Controls - Hidden until hover */}
                 <div className="absolute -top-3 left-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <div className={`px-2 py-0.5 text-[9px] font-bold rounded shadow-sm flex items-center gap-1 cursor-grab ${isDrawer ? 'bg-sky-500 text-white' : 'bg-indigo-500 text-white'}`}>
                       {!isDrawer && <Icons.GripHorizontal className="w-3 h-3" />}
                       {line.name} {idx > 0 && !isDrawer && `(${idx})`}
                    </div>
                    <button type="button" onClick={() => setActiveConfigId(activeConfigId === line.id ? null : line.id)} className="p-1 rounded bg-white dark:bg-slate-800 shadow-sm text-slate-500 hover:text-indigo-500 border border-slate-200 dark:border-slate-700">
                       <Icons.Settings className="w-3 h-3" />
                    </button>
                    {line.id !== "line-1" && (
                       <button type="button" onClick={() => updateState({ layoutLines: layoutLines.filter((l: any) => l.id !== line.id) })} className="p-1 rounded bg-white dark:bg-slate-800 shadow-sm text-rose-500 hover:text-rose-600 border border-slate-200 dark:border-slate-700 transition">
                          <Icons.Trash className="w-3 h-3" />
                       </button>
                    )}
                 </div>

                 {/* Row Config Popover */}
                 {activeConfigId === line.id && (
                    <div className="absolute -top-12 left-16 z-30 flex items-center gap-3 p-2 bg-slate-800 text-white rounded-lg shadow-xl animate-in fade-in zoom-in-95">
                       <span className="text-[10px] font-bold text-slate-300">Justify Content:</span>
                       <select value={lStyle.justify || 'start'} onChange={e => updateState({ lineSettings: {...lineSettings, [line.id]: {...lStyle, justify: e.target.value}} })} className="bg-slate-900 border border-slate-700 rounded px-1 text-[10px] outline-none">
                          <option value="start">Start (Left)</option><option value="center">Center</option><option value="end">End (Right)</option><option value="between">Space Between</option>
                       </select>
                       <button type="button" onClick={(e) => { e.stopPropagation(); setActiveConfigId(null) }} className="hover:text-amber-400"><Icons.X className="w-3 h-3" /></button>
                    </div>
                 )}

                 {/* Dropzone Render Box */}
                 <div data-dropzone={line.id} className={`grid grid-cols-12 gap-x-2 gap-y-4 min-h-[60px] p-2 pt-4 ${line.cols.length === 0 ? 'bg-slate-50/50 dark:bg-slate-900/50' : ''} rounded relative`} onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); handleDrop(e, null, line.id) }}>
                    {/* Visual Grid Alignment Borders */}
                    <div className="absolute inset-x-2 inset-y-2 grid grid-cols-12 gap-x-2 pointer-events-none z-0 opacity-40 dark:opacity-20">
                       {Array.from({length: 12}).map((_, i) => (
                          <div key={i} className="h-full border-x border-dashed border-indigo-200 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-sm" />
                       ))}
                    </div>
                    {line.cols.length === 0 && <div className="col-span-12 text-[10px] text-slate-400 italic pointer-events-none w-full text-center mt-3 z-10 relative">Empty Dropzone...</div>}
                    
                    {line.cols.map((k: string, colIndex: number) => {
                       const isRightSide = line.cols.length > 1 && colIndex > (line.cols.length / 2 - 0.5);
                       const anchorClass = isRightSide ? 'right-0 origin-top-right' : 'left-0 origin-top-left';
                       const isAction = k.startsWith("__action_")
                       const elConfig = elementSettings[k] || {}
                       
                       const spanWidth = elConfig.width === 'full' ? 12 : elConfig.width === '1/2' ? 6 : elConfig.width === '1/3' ? 4 : elConfig.width === '1/4' ? 3 : 2
                       const startCol = elConfig.startCol || 1
                       const labelPos = elConfig.labelPos || 'top' // top, inline, hidden
                       const alignClass = elConfig.align === 'center' ? 'text-center items-center justify-center' : elConfig.align === 'right' ? 'text-right items-end justify-end' : 'text-left items-start justify-start'
                       const renderType = elConfig.renderType || columnStyles[k] || "text"
                       
                       let colorStyle = "text-slate-400 dark:text-slate-600"
                       let wrapperClass = ""
                       
                       if (renderType === "badge") {
                          colorStyle = "bg-slate-50 dark:bg-slate-900 border-dashed text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700"
                          wrapperClass = `${colorStyle} px-2 py-1 flex items-center justify-center rounded-md border text-[10px] font-mono text-center`
                       }
                       
                       if (isAction) {
                          wrapperClass = "px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-500/10 border-dashed flex items-center justify-center text-[10px] text-indigo-500 dark:text-indigo-400 font-bold rounded-lg border border-indigo-200 dark:border-indigo-500/30"
                       }

                       return (
                           <div 
                              key={k} 
                              draggable 
                              onDragStart={e => handleDragStart(e, k, line.id, 'element')} 
                              onDragOver={e => e.preventDefault()} 
                              onDrop={e => { e.stopPropagation(); handleDrop(e, k, line.id) }} 
                              className={`relative ${activeConfigId === k ? 'z-[100]' : 'z-10'} group/el flex ${labelPos === 'inline' ? 'flex-row items-center gap-2' : 'flex-col gap-1'} ${alignClass} p-1.5 border border-transparent hover:border-indigo-400 border-dashed rounded cursor-grab shadow-sm bg-slate-50 dark:bg-slate-900 transition-colors w-full`}
                              style={{ gridColumn: `${startCol} / span ${spanWidth}`, gridRow: 1 }}
                           >
                              {/* Field Setup Gear */}
                              <button type="button" onClick={() => setActiveConfigId(activeConfigId === k ? null : k)} className="absolute -top-2 -right-2 bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity z-10 shadow cursor-pointer">
                                 <Icons.Settings className="w-3 h-3" />
                              </button>

                              {labelPos !== 'hidden' && !isAction && (
                                 <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold shrink-0">{k}</span>
                              )}
                              <div className={wrapperClass ? wrapperClass : `${colorStyle} text-[11px] italic font-mono`}>{isAction ? `⚡ ${k.replace("__action_", "")}` : `[ ${k} ]`}</div>

                              {/* Element Config Popover */}
                              {activeConfigId === k && (
                                  <div className={`absolute top-full mt-2 ${anchorClass} z-[200] w-64 p-3 bg-slate-800 border border-slate-700/80 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 flex flex-col gap-3`}>
                                     <div className="flex justify-between items-center border-b border-slate-700 pb-1.5 mb-1 flex-wrap gap-2">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none flex items-center gap-1.5"><Icons.Settings className="w-3 h-3 text-indigo-400" /> {isAction ? 'Action Config' : 'Inspector'}: <span className="text-indigo-300">{k.replace('__action_', '')}</span></span>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setActiveConfigId(null) }} className="text-slate-400 hover:text-white"><Icons.X className="w-3 h-3" /></button>
                                     </div>
                                     <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Width Slider</span>
                                        <input type="range" min="1" max="5" step="1" title={elConfig.width || 'auto'} value={elConfig.width === '1/4' ? 2 : elConfig.width === '1/3' ? 3 : elConfig.width === '1/2' ? 4 : elConfig.width === 'full' ? 5 : 1} onChange={e => {
                                           const w = e.target.value === '1' ? 'auto' : e.target.value === '2' ? '1/4' : e.target.value === '3' ? '1/3' : e.target.value === '4' ? '1/2' : 'full'
                                           updateState({ elementSettings: {...elementSettings, [k]: {...elConfig, width: w}} })
                                        }} className="w-full accent-indigo-500" />
                                        <div className="flex justify-between text-[8px] text-slate-500 font-bold"><span>Auto</span><span>25%</span><span>33%</span><span>50%</span><span>100%</span></div>
                                     </div>
                                     {!isAction && (
                                        <>
                                           <div className="flex flex-col gap-1 mb-2">
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Text Alignment</span>
                                              <div className="flex bg-slate-900 rounded p-0.5">
                                                 {['left', 'center', 'right'].map(alg => (
                                                    <button key={alg} type="button" onClick={() => updateState({ elementSettings: {...elementSettings, [k]: {...elConfig, align: alg}} })} className={`flex-1 py-1 text-[10px] font-bold rounded ${elConfig.align === alg || (!elConfig.align && alg==='left') ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>{alg.toUpperCase()}</button>
                                                 ))}
                                              </div>
                                           </div>
                                           <div className="flex flex-col gap-1">
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Label Visibility</span>
                                              <select value={elConfig.labelPos || 'top'} onChange={e => updateState({ elementSettings: {...elementSettings, [k]: {...elConfig, labelPos: e.target.value}} })} className="p-1 rounded border border-slate-700 bg-slate-900 text-slate-200 text-[10px] outline-none">
                                                 <option value="top">Top Header</option>
                                                 <option value="inline">Inline (Left of Value)</option>
                                                 <option value="hidden">Hidden</option>
                                              </select>
                                           </div>
                                           <div className="flex flex-col gap-1">
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visual Style</span>
                                              <select value={elConfig.renderType || columnStyles[k] || 'text'} onChange={e => updateState({ elementSettings: {...elementSettings, [k]: {...elConfig, renderType: e.target.value}}, columnStyles: {...columnStyles, [k]: e.target.value} })} className="p-1 rounded border border-slate-700 bg-slate-900 text-slate-200 text-[10px] outline-none">
                                                 <option value="text">Flat Text</option>
                                                 <option value="badge">Badge/Box Container</option>
                                              </select>
                                           </div>
                                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-700 mt-2 pb-1">
                                               <label className="flex items-center gap-2 cursor-pointer group">
                                                  <input type="checkbox" checked={!!elConfig.isSortable} onChange={e => updateState({ elementSettings: {...elementSettings, [k]: {...elConfig, isSortable: e.target.checked}} })} className="w-3 h-3 accent-indigo-500 rounded bg-slate-900 border-slate-700 cursor-pointer" />
                                                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">Orderable (Sorting)</span>
                                               </label>
                                               <label className="flex items-center gap-2 cursor-pointer group">
                                                  <input type="checkbox" checked={!!elConfig.isSearchable} onChange={e => updateState({ elementSettings: {...elementSettings, [k]: {...elConfig, isSearchable: e.target.checked}} })} className="w-3 h-3 accent-indigo-500 rounded bg-slate-900 border-slate-700 cursor-pointer" />
                                                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">Searchable (Global Filter)</span>
                                               </label>
                                               <label className="flex items-center gap-2 cursor-pointer group">
                                                  <input type="checkbox" checked={!!elConfig.isFilterable} onChange={e => updateState({ elementSettings: {...elementSettings, [k]: {...elConfig, isFilterable: e.target.checked}} })} className="w-3 h-3 accent-indigo-500 rounded bg-slate-900 border-slate-700 cursor-pointer" />
                                                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">Filterable (Distinct Values)</span>
                                               </label>
                                            </div>
                                        </>
                                     )}
                                     {isAction && (
                                        <div className="pt-2 border-t border-slate-700 mt-1">
                                           <button 
                                              type="button"
                                              onClick={(e) => { 
                                                 e.stopPropagation()
                                                 const actName = k.replace('__action_', '')
                                                 const idx = customActions.findIndex((a: any) => a.name === actName)
                                                 if (idx > -1) {
                                                    setEditingActionIndex(idx)
                                                    setShowActionWizard(true)
                                                    setActiveConfigId(null)
                                                 }
                                              }}
                                              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 py-1.5 rounded shadow transition-colors uppercase"
                                           >
                                              <Icons.Zap className="w-3 h-3" />
                                              Edit Action Protocol
                                           </button>
                                        </div>
                                     )}
                                  </div>
                              )}
                           </div>
                       )
                    })}
                 </div>
               </div>
             )
          })}
        </div>
        </div>

        {/* Unmapped Properties Deck */}
        {poolKeys.length > 0 && (
           <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pb-1 mb-2 block">Available Properties (Drag & Drop to map)</label>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-100 dark:bg-slate-900 rounded-lg shadow-inner" onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); handleDrop(e, null, "unmapped") }}>
                 {poolKeys.filter((k: string) => !layoutLines.some((l: any) => l.cols.includes(k))).map((k: string) => {
                    const isAction = k.startsWith("__action_")
                    return (
                       <div key={k} draggable onDragStart={e => handleDragStart(e, k, "unmapped", "element")} className={`flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 px-2.5 py-1.5 text-[10px] shadow-sm cursor-grab hover:border-indigo-400 transition-colors ${isAction ? 'text-rose-600 bg-rose-50 dark:bg-rose-950 font-bold border-rose-200 dark:border-rose-900' : 'font-mono text-slate-600 dark:text-slate-300'}`}>
                          <Icons.GripVertical className="w-3 h-3 opacity-50" /> {isAction ? `⚡ Action: ${k.replace("__action_", "")}` : k}
                       </div>
                    )
                 })}
                 {poolKeys.filter((k: string) => !layoutLines.some((l: any) => l.cols.includes(k))).length === 0 && (
                    <span className="text-[9px] text-emerald-500 font-bold self-center px-4"><Icons.Check className="w-3 h-3 inline mr-1" /> All Available Properties Mapped!</span>
                 )}
              </div>
           </div>
        )}

        {/* Dynamic API Callback Manager */}
        <div className="bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-xl shadow-inner mt-4 relative z-0">
           <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Icons.Zap className="w-3.5 h-3.5" /> Bound Action Logic Controllers</label>
              <button type="button" onClick={() => { setEditingActionIndex(null); setShowActionWizard(true); }} className="text-[10px] px-2 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/40 transition-colors flex items-center gap-1"><Icons.Plus className="w-3 h-3" /> Add Action Endpoint</button>
           </div>
           {customActions.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-3">No actions configured. Drag mapped actions onto UI elements.</p>
           ) : (
               <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {customActions.map((action, i) => (
                     <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5"><Icons.Zap className="w-4 h-4 text-amber-500" /> {action.name}</span>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-mono px-1.5 bg-slate-200 dark:bg-slate-800 rounded font-bold">{action.type || "API"}</span>
                              <span className="text-[9px] font-mono text-slate-500 truncate max-w-[200px]" title={action.endpoint || action.payloadTemplate}>{action.method === "DB_EXECUTE" ? 'System Exec' : action.endpoint}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-1">
                           <button type="button" onClick={() => setEditingActionIndex(i)} className="text-slate-400 hover:text-indigo-500 p-1.5 transition-colors"><Icons.Settings className="w-4 h-4" /></button>
                           <button type="button" onClick={() => { const ac = [...customActions]; ac.splice(i, 1); updateState({ customActions: ac }) }} className="text-rose-500 hover:text-rose-600 p-1.5 transition-colors"><Icons.Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                  ))}
               </div>
           )}
       </div>
       
       {(showActionWizard || editingActionIndex !== null) && (
         <ActionWizardModal 
           initialState={editingActionIndex !== null ? customActions[editingActionIndex] : undefined}
           onClose={() => { setShowActionWizard(false); setEditingActionIndex(null); }}
           onFinish={(actionPayload) => {
             const ac = [...customActions]
             const linesCp = [...layoutLines]
             const elSets = { ...elementSettings }
             
             if (editingActionIndex !== null) {
                const oldName = ac[editingActionIndex].name;
                const newName = actionPayload.name;
                
                if (oldName !== newName) {
                   linesCp.forEach(l => {
                      const idx = l.cols.indexOf(`__action_${oldName}`);
                      if (idx > -1) l.cols[idx] = `__action_${newName}`;
                   })
                   if (elSets[`__action_${oldName}`]) {
                      elSets[`__action_${newName}`] = elSets[`__action_${oldName}`];
                      delete elSets[`__action_${oldName}`];
                   }
                }
                ac[editingActionIndex] = actionPayload;
             } else {
                ac.push(actionPayload)
             }
             
             updateState({ customActions: ac, layoutLines: linesCp, elementSettings: elSets })
             setShowActionWizard(false)
             setEditingActionIndex(null)
           }}
         />
       )}
      </div>
    </div>
  )
}
