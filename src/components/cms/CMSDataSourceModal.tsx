"use client"

import { useState } from "react"
import { Database, Plus, X, Server, KeyRound, TimerReset, Palette, ChevronRight, ChevronLeft } from "lucide-react"
import { createAppDataSource, updateAppDataSource } from "@/app/actions/cms"
import { useRouter } from "next/navigation"

export function CMSDataSourceModal({ editSource, onClose }: { editSource?: any, onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(!!editSource)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Form State
  const parseCreds = (jsonStr: string, key: string) => {
    try { return JSON.parse(jsonStr)[key] || "" } catch { return "" }
  }
  
  const parseMapping = (jsonStr: string, key: string, defaultVal: string) => {
    try { return JSON.parse(jsonStr)[key] || defaultVal } catch { return defaultVal }
  }

  const [formData, setFormData] = useState({
    name: editSource?.name || "",
    type: editSource?.type || "REST_API",
    endpointURI: editSource?.endpointURI || "",
    credentialsJson: editSource?.credentialsJson || "{\n  \"headers\": {\n    \"Authorization\": \"Bearer TOKEN\"\n  }\n}",
    dbHost: editSource ? parseCreds(editSource.credentialsJson, "host") : "",
    dbPort: editSource ? parseCreds(editSource.credentialsJson, "port") : "",
    dbName: editSource ? parseCreds(editSource.credentialsJson, "database") : "",
    dbUser: editSource ? parseCreds(editSource.credentialsJson, "user") : "",
    dbPassword: editSource ? parseCreds(editSource.credentialsJson, "password") : "",
    queryPayload: editSource?.queryPayload || "",
    refreshInterval: editSource?.refreshInterval || 10,
    statusColumn: editSource ? parseMapping(editSource.mappingJson, "targetColumn", "status") : "status",
    downValue: editSource ? parseMapping(editSource.mappingJson, "downValue", "0") : "0",
    upValue: editSource ? parseMapping(editSource.mappingJson, "upValue", "1") : "1"
  })

  const isDb = ["POSTGRESQL", "MYSQL", "MARIADB", "ORACLE"].includes(formData.type)

  // Handlers
  const handleNext = () => setStep(s => Math.min(s + 1, 5))
  const handlePrev = () => setStep(s => Math.max(s - 1, 1))

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step !== 5) return handleNext()

    setIsSubmitting(true)
    
    // Construct the Presentation Configuration JSON mapped out of the form fields
    const mappingJson = JSON.stringify({
      targetColumn: formData.statusColumn,
      downValue: formData.downValue,
      upValue: formData.upValue
    })

    let finalURI = formData.endpointURI
    let finalCreds = formData.credentialsJson

    if (isDb) {
      finalURI = `${formData.dbHost}:${formData.dbPort}/${formData.dbName}`
      finalCreds = JSON.stringify({
        host: formData.dbHost,
        port: formData.dbPort,
        database: formData.dbName,
        user: formData.dbUser,
        password: formData.dbPassword
      }, null, 2)
    }

    try {
      if (editSource) {
        await updateAppDataSource(
          editSource.id,
          formData.name,
          formData.type,
          finalURI,
          finalCreds,
          formData.queryPayload,
          Number(formData.refreshInterval),
          mappingJson
        )
      } else {
        await createAppDataSource(
          formData.name,
          formData.type,
          finalURI,
          finalCreds,
          formData.queryPayload,
          Number(formData.refreshInterval),
          mappingJson
        )
      }
      setIsOpen(false)
      if (onClose) onClose()
      setStep(1)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Failed to sync Wizard mappings into SQLite natively.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => {
    setIsOpen(false)
    if (onClose) onClose()
  }

  return (
    <>
      {!editSource && (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> New Data Source
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" /> 
                {editSource ? "Edit Data Binding" : "New Data Source"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex h-1 bg-slate-800 w-full flex-shrink-0">
              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* STEP 1: ARCHITECTURE */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                    <Server className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-200">System Architecture</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Source Name</label>
                    <input required type="text" value={formData.name} onChange={e => handleFieldChange("name", e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner" placeholder="E.g. Production Telemetry Proxy" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Protocol Architecture</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {["REST_API", "PROMETHEUS", "POSTGRESQL", "MYSQL", "MARIADB", "ORACLE"].map(type => (
                        <div 
                          key={type}
                          onClick={() => handleFieldChange("type", type)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${formData.type === type ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-950 border-slate-700 hover:border-slate-500'}`}
                        >
                          <div className={`w-3 h-3 rounded-full border mb-2 flex items-center justify-center ${formData.type === type ? 'border-indigo-500' : 'border-slate-600'}`}>
                            {formData.type === type && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                          </div>
                          <span className="font-bold text-xs text-white block truncate">{type.replace("_", " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CREDENTIALS */}
              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                    <KeyRound className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-200">Target Hooks & Credentials</h3>
                  </div>

                  {!isDb ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Connection String / URI Endpoint</label>
                        <input required type="text" value={formData.endpointURI} onChange={e => handleFieldChange("endpointURI", e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm transition-colors shadow-inner" placeholder="https://api.internal.corp/production/v1" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center justify-between">
                          Authentication Schema (JSON)
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">Backend Secure</span>
                        </label>
                        <textarea value={formData.credentialsJson} onChange={e => handleFieldChange("credentialsJson", e.target.value)} rows={5} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm shadow-inner transition-colors leading-relaxed" spellCheck={false}></textarea>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Server Host / IP</label>
                        <input required type="text" value={formData.dbHost} onChange={e => handleFieldChange("dbHost", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="10.0.0.51 or db.corp.internal" />
                      </div>
                      <div className="col-span-2 md:col-span-1 border-l pl-4 border-slate-800">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Port</label>
                        <input required type="text" value={formData.dbPort} onChange={e => handleFieldChange("dbPort", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="5432 or 3306" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Database Name / ORACLE SID</label>
                        <input required type="text" value={formData.dbName} onChange={e => handleFieldChange("dbName", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="production_metrics" />
                      </div>
                      <div className="col-span-2 border-t border-slate-800 pt-3 mt-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
                          <input required type="text" value={formData.dbUser} onChange={e => handleFieldChange("dbUser", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="readonly_admin" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                          <input required type="password" value={formData.dbPassword} onChange={e => handleFieldChange("dbPassword", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="••••••••" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: QUERY DEFINITION */}
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                    <Database className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-200">Stateful Query Protocol</h3>
                  </div>

                  <p className="text-sm text-slate-400">Write the raw execution query this Data Source will endlessly pipe (e.g. SQL Statement, PromQL Object, or JSON extraction logic) natively passing to the Proxy compiler.</p>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center justify-between">
                      {isDb ? "SQL Statement" : "REST/Prometheus Endpoint Suffix Query"}
                    </label>
                    <textarea 
                      required 
                      value={formData.queryPayload} 
                      onChange={e => handleFieldChange("queryPayload", e.target.value)} 
                      rows={6} 
                      className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-sm shadow-inner transition-colors" 
                      placeholder={isDb ? "SELECT hostname, cpu_usage, memory_usage FROM system_metrics LIMIT 10;" : "?query=node_cpu_seconds_total&step=1m"}
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: EXECUTION TIMER */}
              {step === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                    <TimerReset className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-200">Execution Timers</h3>
                  </div>

                  <p className="text-sm text-slate-400">Determine how frequently the Next.js Node Proxy invokes the dataset execution mapped out natively into the Client browsers.</p>

                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner max-w-sm">
                    <label className="block text-sm font-medium text-slate-400 mb-4 text-center">Data Polling Frequency (Seconds)</label>
                    <div className="flex items-center gap-4">
                      <input type="range" min="1" max="60" step="1" value={formData.refreshInterval} onChange={e => handleFieldChange("refreshInterval", Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      <div className="w-16 h-10 px-2 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center font-bold text-indigo-400 font-mono flex-shrink-0 shadow-inner">
                        {formData.refreshInterval}s
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: PRESENTATION LOGIC */}
              {step === 5 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                    <Palette className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-200">Presentation Condition Map</h3>
                  </div>

                  <p className="text-sm text-slate-400">Establish logical UI visual coloring states mapped against JSON columns directly natively parsing backend outputs.</p>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-inner">
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Status Object Key</label>
                      <input required type="text" value={formData.statusColumn} onChange={e => handleFieldChange("statusColumn", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="e.g. column_a or link_status" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
                        <label className="block text-[11px] font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> DOWN Value Map
                        </label>
                        <input required type="text" value={formData.downValue} onChange={e => handleFieldChange("downValue", e.target.value)} className="block w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-xs" placeholder="e.g. 0 or DISCONNECTED" />
                      </div>
                      <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                        <label className="block text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" /> HEALTHY Value Map
                        </label>
                        <input required type="text" value={formData.upValue} onChange={e => handleFieldChange("upValue", e.target.value)} className="block w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs" placeholder="e.g. 1 or UP" />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* FOOTER NAVIGATORS */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-auto flex-shrink-0">
                <button type="button" onClick={() => step === 1 ? setIsOpen(false) : handlePrev()} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800">
                  {step === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4" /> Back</>}
                </button>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting || (step === 1 && !formData.name) || (step === 2 && !isDb && !formData.endpointURI) || (step === 2 && isDb && (!formData.dbHost || !formData.dbUser || !formData.dbPassword || !formData.dbName))}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-1 shadow-md shadow-indigo-500/20"
                >
                  {isSubmitting ? "Finalizing Mappings..." : step === 5 ? "Build Data Source" : <>Next Step <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}
