"use client"

import { useState } from "react"
import { ListOrdered, X, ArrowUp, ArrowDown } from "lucide-react"
import { updateNavigationOrder } from "@/app/actions/cms"
import { useRouter } from "next/navigation"

type NavItem = {
  id: string;
  label: string;
  path: string;
  sortOrder: number;
};

export function NavigationOrderModal({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [navs, setNavs] = useState<NavItem[]>(items.sort((a,b) => a.sortOrder - b.sortOrder))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newNavs = [...navs];
    const temp = newNavs[index];
    newNavs[index] = newNavs[index - 1];
    newNavs[index - 1] = temp;
    newNavs.forEach((n, i) => n.sortOrder = i + 1);
    setNavs(newNavs);
  }

  const handleMoveDown = (index: number) => {
    if (index === navs.length - 1) return;
    const newNavs = [...navs];
    const temp = newNavs[index];
    newNavs[index] = newNavs[index + 1];
    newNavs[index + 1] = temp;
    newNavs.forEach((n, i) => n.sortOrder = i + 1);
    setNavs(newNavs);
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await updateNavigationOrder(navs.map(n => ({ id: n.id, sortOrder: n.sortOrder })))
      setIsOpen(false)
      router.refresh()
    } catch (e) {
      alert("Failed to update navigation order.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const parseLabel = (jsonLabel: string) => {
    try {
      const p = JSON.parse(jsonLabel);
      return p.en || p.tr || jsonLabel;
    } catch {
      return jsonLabel;
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-slate-700 shadow-lg"
      >
        <ListOrdered className="w-4 h-4" /> Edit Order
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-emerald-400" /> Navigation Order
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {navs.map((nav, idx) => (
                <div key={nav.id} className="flex items-center justify-between bg-slate-950/50 border border-slate-800 p-3 rounded-xl hover:border-slate-700 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-200 text-sm">{parseLabel(nav.label)}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{nav.path}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 bg-slate-800 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500/10 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === navs.length - 1}
                      className="p-1.5 bg-slate-800 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500/10 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {navs.length === 0 && (
                <div className="text-center text-slate-500 py-6 text-sm">No navigation items bound to the system.</div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-slate-800 bg-slate-900/30">
              <button disabled={isSubmitting} onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSubmitting} 
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? "Saving..." : "Save Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
