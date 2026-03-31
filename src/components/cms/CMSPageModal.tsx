"use client"

import { useState } from "react"
import { Plus, X, Globe } from "lucide-react"
import { createAppPage } from "@/app/actions/cms"
import { useRouter } from "next/navigation"

export function CMSPageModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createAppPage(formData)
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Failed to bind CMS Page. Ensure slashes/unique params match SQLite constraints.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
      >
        <Plus className="w-4 h-4" /> New Page
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Layout Instantiation
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Route Slug</label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sm:text-sm">
                      /p/
                    </span>
                    <input required type="text" name="slug" id="slug" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="telemetry-dashboard" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="titleEn" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title (EN)</label>
                    <input required type="text" name="titleEn" id="titleEn" className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Network Map" />
                  </div>
                  <div>
                    <label htmlFor="titleTr" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title (TR)</label>
                    <input required type="text" name="titleTr" id="titleTr" className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Ağ Haritası" />
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <input defaultChecked id="addToNav" name="addToNav" type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500" />
                  <label htmlFor="addToNav" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                    Auto-bind to Global Navigation System
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button disabled={isSubmitting} type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                  {isSubmitting ? "Deploying..." : "Generate Layout Payload"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}
