"use client"

import { Server, Trash2, KeyRound, Pencil } from "lucide-react"
import { deleteAppDataSource } from "@/app/actions/cms"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CMSDataSourceModal } from "./CMSDataSourceModal"

export function CMSDataSourceList({ initialSources }: { initialSources: any[] }) {
  const [sources, setSources] = useState(initialSources)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingSource, setEditingSource] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<"WIDGET" | "ACTION">("WIDGET")
  const router = useRouter()

  useEffect(() => {
    setSources(initialSources)
  }, [initialSources])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteAppDataSource(id)
      setSources(s => s.filter(x => x.id !== id))
      router.refresh()
    } catch {
      alert("Failed to drop connection.")
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSources = sources.filter(s => s.usageType === activeTab || (!s.usageType && activeTab === "WIDGET"))

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab("WIDGET")} 
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "WIDGET" ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          Telemetry Sources (Read)
        </button>
        <button 
          onClick={() => setActiveTab("ACTION")} 
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "ACTION" ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          Action Controllers (Write)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredSources.map(s => (
        <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-100 dark:border-transparent">
                  <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">{s.name}</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                {s.type}
              </span>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Target Endpoint / DB-URI</span>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 mt-1 pl-1 line-clamp-1 break-all" title={s.endpointURI}>{s.endpointURI}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Auth Keys
                  </span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 mt-1 pl-1">
                    {s.credentialsJson === "{}" || s.credentialsJson.length < 5 ? "None" : "Stored Securely"}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest pl-1">
                    Refresh Rate
                  </span>
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 pl-1">
                    {s.refreshInterval} Seconds
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 flex flex-col mt-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Status Condition Bindings</span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 pl-1 line-clamp-2">
                  {s.mappingJson}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50 gap-2">
            <button 
              onClick={() => setEditingSource(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-lg transition-colors border border-indigo-200 dark:border-indigo-500/20"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Binding
            </button>
            <button 
              disabled={deletingId === s.id}
              onClick={() => handleDelete(s.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-lg transition-colors border border-rose-200 dark:border-rose-500/20 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Node
            </button>
          </div>
        </div>
      ))}

      {filteredSources.length === 0 && (
        <div className="md:col-span-2 text-center py-20 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
          <Server className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No {activeTab} Endpoints Mapped</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Click "New Data Source" to securely bind a new {activeTab.toLowerCase()} connection.</p>
        </div>
      )}

      {editingSource && (
         <CMSDataSourceModal 
           editSource={editingSource} 
           onClose={() => setEditingSource(null)} 
         />
      )}
      </div>
    </div>
  )
}
