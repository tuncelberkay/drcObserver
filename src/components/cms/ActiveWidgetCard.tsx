"use client"

import { useState } from "react"
import { Trash2, Link as IconLink, Layout, Edit2 } from "lucide-react"
import { removeWidget } from "@/app/actions/cms"
import { ActiveWidgetEditor } from "./ActiveWidgetEditor"

export function ActiveWidgetCard({ widget, sources }: { widget: any, sources: any[] }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleRemove = async () => {
    setIsDeleting(true)
    try {
      await removeWidget(widget.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700 bg-slate-950 shadow-md">
      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
        <Layout className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-200">{widget.componentKey}</h4>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">ID: {widget.id.slice(-6)}</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
          <IconLink className="w-3 h-3" /> Config: {widget.configJson === "{}" ? "Default Payload" : "Customized"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700 font-mono hidden sm:block">
          w:{widget.w} h:{widget.h}
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition-colors border border-transparent hover:border-indigo-500/30"
          title="Edit Widget Configuration"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          disabled={isDeleting}
          onClick={handleRemove}
          className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-colors disabled:opacity-50 border border-transparent hover:border-rose-500/30"
          title="Delete Widget"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isEditing && (
        <ActiveWidgetEditor 
          widget={widget} 
          sources={sources} 
          onClose={() => setIsEditing(false)} 
        />
      )}
    </div>
  )
}
