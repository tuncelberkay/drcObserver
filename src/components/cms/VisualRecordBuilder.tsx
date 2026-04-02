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

  const rawKeys = previewDataArray?.[0] ? Object.keys(previewDataArray[0]).filter(k => typeof previewDataArray[0][k] !== "object" || Array.isArray(previewDataArray[0][k])) : []
  const actionKeys = customActions.map(a => `__action_${a.name}`)
  const poolKeys = [...rawKeys, ...actionKeys]
  const mockRow = previewDataArray?.[0] || {}

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
      if (lineIdStr === "drawer" || targetLineId === "drawer") return // Don't move drawer
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
       updateState({ layoutLines: linesCp })
    }
  }

  const addLine = () => {
    updateState({ layoutLines: [
        ...layoutLines.filter(l => l.id !== "drawer"),
        { id: `line-${Date.now()}`, name: `Record Line`, cols: [] },
        layoutLines.find(l => l.id === "drawer")
     ].filter(Boolean) 
    })
  }

  const addDrawer = () => {
    if (!layoutLines.find((l: any) => l.id === "drawer")) {
       updateState({ layoutLines: [
          ...layoutLines,
          { id: "drawer", name: "Embedded Detail Drawer", cols: [] }
       ]})
    }
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
          <button type="button" disabled={!!layoutLines.find((l: any) => l.id === "drawer")} onClick={addDrawer} className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold border border-slate-200 dark:border-slate-700 rounded hover:border-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            + Add Child Drawer
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
             const isDrawer = line.id === 'drawer'

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
                 <div data-dropzone={line.id} className={`flex flex-wrap gap-2 min-h-[50px] p-2 pt-4 ${justifyClass} ${line.cols.length === 0 ? 'bg-slate-50/50 dark:bg-slate-900/50' : ''} rounded`} onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); handleDrop(e, null, line.id) }}>
                    {line.cols.length === 0 && <div className="text-[10px] text-slate-400 italic pointer-events-none w-full text-center mt-2">Empty Dropzone...</div>}
                    
                    {line.cols.map((k: string) => {
                       const isAction = k.startsWith("__action_")
                       const elConfig = elementSettings[k] || {}
                       
                       const widthClass = elConfig.width === 'full' ? 'w-full' : elConfig.width === '1/2' ? 'w-[calc(50%-8px)]' : elConfig.width === '1/3' ? 'w-[calc(33.33%-10px)]' : elConfig.width === '1/4' ? 'w-[calc(25%-12px)]' : 'min-w-[100px]'
                       const labelPos = elConfig.labelPos || 'top' // top, inline, hidden
                       const alignClass = elConfig.align === 'center' ? 'text-center items-center justify-center' : elConfig.align === 'right' ? 'text-right items-end justify-end' : 'text-left items-start justify-start'
                       const renderType = elConfig.renderType || columnStyles[k] || "text"
                       
                       const val = mockRow[k]
                       const text = val !== null && val !== undefined ? String(val) : (isAction ? "Action Button" : "-")
                       
                       let colorStyle = "text-slate-700 dark:text-slate-300"
                       let wrapperClass = ""
                       if (typeof val === "string") {
                         const lower = val.toLowerCase()
                         if (['running', 'ok'].includes(lower)) colorStyle = "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200"
                         else if (['error', 'failed', 'critical'].includes(lower)) colorStyle = "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200"
                         else if (renderType === "badge") colorStyle = "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200"
                       } else if (renderType === "badge") {
                          colorStyle = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                       }
                       if (colorStyle.includes("bg-") || renderType === "badge") wrapperClass = `${colorStyle} px-2.5 py-1 rounded-md border text-[11px] font-bold shadow-sm inline-block`
                       if (isAction) wrapperClass = "px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/20 text-[11px] text-indigo-700 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-500/30 shadow-sm"

                       return (
                           <div 
                              key={k} 
                              draggable 
                              onDragStart={e => handleDragStart(e, k, line.id, 'element')} 
                              onDragOver={e => e.preventDefault()} 
                              onDrop={e => { e.stopPropagation(); handleDrop(e, k, line.id) }} 
                              className={`relative group/el flex ${labelPos === 'inline' ? 'flex-row items-center gap-2' : 'flex-col gap-1'} ${widthClass} ${alignClass} p-1.5 border border-transparent hover:border-indigo-400 border-dashed rounded cursor-grab shadow-sm bg-slate-50 dark:bg-slate-900 transition-colors`}
                           >
                              {/* Field Setup Gear */}
                              <button type="button" onClick={() => setActiveConfigId(activeConfigId === k ? null : k)} className="absolute -top-2 -right-2 bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity z-10 shadow cursor-pointer">
                                 <Icons.Settings className="w-3 h-3" />
                              </button>

                              {labelPos !== 'hidden' && !isAction && (
                                 <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold shrink-0">{k}</span>
                              )}
                              <div className={wrapperClass ? wrapperClass : `${colorStyle} text-sm font-medium`}>{isAction ? `⚡ ${k.replace("__action_", "")}` : text}</div>

                              {/* Element Config Popover */}
                              {activeConfigId === k && (
                                  <div className={`absolute ${isDrawer ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'} left-0 z-50 w-56 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 flex flex-col gap-3`}>
                                     <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">Element Details</span>
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
                                     <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Text Alignment</span>
                                        <div className="flex bg-slate-900 rounded p-0.5">
                                           {['left', 'center', 'right'].map(alg => (
                                              <button key={alg} type="button" onClick={() => updateState({ elementSettings: {...elementSettings, [k]: {...elConfig, align: alg}} })} className={`flex-1 py-1 text-[10px] font-bold rounded ${elConfig.align === alg || (!elConfig.align && alg==='left') ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>{alg.toUpperCase()}</button>
                                           ))}
                                        </div>
                                     </div>
                                     {!isAction && (
                                        <>
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
                                        </>
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
              <button type="button" onClick={() => setShowActionWizard(true)} className="text-[10px] px-2 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/40 transition-colors flex items-center gap-1"><Icons.Plus className="w-3 h-3" /> Add Action Endpoint</button>
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
                        <button type="button" onClick={() => { const ac = [...customActions]; ac.splice(i, 1); updateState({ customActions: ac }) }} className="text-rose-500 hover:text-rose-600 p-1.5 transition-colors"><Icons.Trash2 className="w-4 h-4" /></button>
                     </div>
                  ))}
               </div>
           )}
       </div>
       
       {showActionWizard && (
         <ActionWizardModal 
           onClose={() => setShowActionWizard(false)}
           onFinish={(actionPayload) => {
             updateState({ customActions: [...customActions, actionPayload] })
             setShowActionWizard(false)
           }}
         />
       )}
      </div>
    </div>
  )
}
