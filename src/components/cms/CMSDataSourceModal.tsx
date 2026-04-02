"use client"

import { useState } from "react"
import { Database, Plus, X, Server, KeyRound, TimerReset, Check, ChevronRight, ChevronLeft, Cpu, Network } from "lucide-react"
import { createAppDataSource, updateAppDataSource } from "@/app/actions/cms"
import { useRouter } from "next/navigation"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function CMSDataSourceModal({ editSource, onClose }: { editSource?: any, onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(!!editSource)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const router = useRouter()

  // Form State
  const parseCreds = (jsonStr: string, key: string) => {
    try { return JSON.parse(jsonStr)[key] || "" } catch { return "" }
  }

  const [formData, setFormData] = useState({
    name: editSource?.name || "",
    type: editSource?.type || "REST_API",
    usageType: editSource?.usageType || "WIDGET",
    endpointURI: editSource?.endpointURI || "",
    credentialsJson: editSource?.credentialsJson || "{\n  \"headers\": {\n    \"Authorization\": \"Bearer TOKEN\"\n  }\n}",
    dbHost: editSource ? parseCreds(editSource.credentialsJson, "host") : "",
    dbPort: editSource ? parseCreds(editSource.credentialsJson, "port") : "",
    dbName: editSource ? parseCreds(editSource.credentialsJson, "database") : "",
    dbUser: editSource ? parseCreds(editSource.credentialsJson, "user") : "",
    dbPassword: editSource ? parseCreds(editSource.credentialsJson, "password") : "",
    queryPayload: editSource?.queryPayload || "",
    refreshInterval: editSource?.refreshInterval || 10,
    vaultMode: editSource ? (parseCreds(editSource.credentialsJson, "cyberArk") ? "cyberark" : "local") : "local",
    caAppId: editSource ? parseCreds(editSource.credentialsJson, "cyberArk")?.appId || "" : "",
    caSafe: editSource ? parseCreds(editSource.credentialsJson, "cyberArk")?.safe || "" : "",
    caObject: editSource ? parseCreds(editSource.credentialsJson, "cyberArk")?.objectName || "" : ""
  })

  const isDb = ["POSTGRESQL", "MYSQL", "MARIADB", "ORACLE", "postgres", "mysql", "oracle"].includes(formData.type)
  const totalSteps = formData.usageType === "ACTION" ? 2 : 4

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps))
  const handlePrev = () => setStep(s => Math.max(s - 1, 1))

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step !== totalSteps) return handleNext()

    setIsSubmitting(true)
    let finalURI = formData.endpointURI
    let finalCreds = formData.credentialsJson

    if (formData.vaultMode === "cyberark") {
      if (isDb) {
        finalCreds = JSON.stringify({
          host: formData.dbHost,
          port: formData.dbPort,
          database: formData.dbName,
          cyberArk: { appId: formData.caAppId, safe: formData.caSafe, objectName: formData.caObject }
        }, null, 2)
      } else {
        let existing: any = {}
        try { existing = JSON.parse(finalCreds) } catch(e) {}
        existing.cyberArk = { appId: formData.caAppId, safe: formData.caSafe, objectName: formData.caObject }
        finalCreds = JSON.stringify(existing, null, 2)
      }
    } else {
      if (isDb) {
        finalCreds = JSON.stringify({
          host: formData.dbHost,
          port: formData.dbPort,
          database: formData.dbName,
          user: formData.dbUser,
          password: formData.dbPassword
        }, null, 2)
      }
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
          formData.usageType
        )
      } else {
        await createAppDataSource(
          formData.name,
          formData.type,
          finalURI,
          finalCreds,
          formData.queryPayload,
          Number(formData.refreshInterval),
          formData.usageType
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
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" /> New Data Source
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{editSource ? "Edit Data Binding" : "New Data Source"}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Connect a new database or API to the CMS platform</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex h-1 bg-slate-100 dark:bg-slate-800 w-full flex-shrink-0">
              <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Server className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">System Architecture</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source Name</label>
                    <input required type="text" value={formData.name} onChange={e => handleFieldChange("name", e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner" placeholder="E.g. Production Telemetry" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Protocol Architecture</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {["REST_API", "postgres", "mysql", "oracle"].map(type => (
                        <div 
                          key={type}
                          onClick={() => handleFieldChange("type", type)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${formData.type === type ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                        >
                          <div className={`w-3 h-3 rounded-full border mb-2 flex items-center justify-center ${formData.type === type ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {formData.type === type && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                          </div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{type.replace("_", " ").toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Usage Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => handleFieldChange("usageType", "WIDGET")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${formData.usageType === "WIDGET" ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                      >
                         <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Telemetry Widget (Read)</span>
                         <div className={`w-3 h-3 rounded-full border flex flex-shrink-0 items-center justify-center ${formData.usageType === "WIDGET" ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {formData.usageType === "WIDGET" && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                          </div>
                      </div>
                      <div 
                        onClick={() => handleFieldChange("usageType", "ACTION")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${formData.usageType === "ACTION" ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                      >
                         <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Action Controller (Write)</span>
                         <div className={`w-3 h-3 rounded-full border flex flex-shrink-0 items-center justify-center ${formData.usageType === "ACTION" ? 'border-rose-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {formData.usageType === "ACTION" && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <KeyRound className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Target Hooks & Credentials</h3>
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                    <button type="button" onClick={() => handleFieldChange("vaultMode", "local")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.vaultMode === "local" ? "bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                       Local Architecture
                    </button>
                    <button type="button" onClick={() => handleFieldChange("vaultMode", "cyberark")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.vaultMode === "cyberark" ? "bg-indigo-600 shadow text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                       CyberArk Vault
                    </button>
                  </div>

                  {!isDb ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Connection String / URI Endpoint</label>
                        <input required type="text" value={formData.endpointURI} onChange={e => handleFieldChange("endpointURI", e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm transition-colors shadow-inner" placeholder="https://api.internal.corp/production/v1" />
                      </div>

                      {formData.vaultMode === "cyberark" && (
                        <div className="space-y-4 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 mt-4">
                           <div>
                             <label className="block text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">CyberArk AppID</label>
                             <input required type="text" value={formData.caAppId} onChange={e => handleFieldChange("caAppId", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="App_DRC_Auth" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">Target SafeName</label>
                               <input required type="text" value={formData.caSafe} onChange={e => handleFieldChange("caSafe", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="DRC-PROD-APIS" />
                             </div>
                             <div>
                               <label className="block text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">Target Object ID</label>
                               <input required type="text" value={formData.caObject} onChange={e => handleFieldChange("caObject", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="rest-api-token-01" />
                             </div>
                           </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          Authentication Schema (JSON)
                          <div className="flex gap-2 items-center">
                            {formData.vaultMode === "cyberark" && <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-mono border border-indigo-200 dark:border-indigo-500/30">Inject Vault: {'{{VAULT_TOKEN}}'}</span>}
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">Backend Secure</span>
                          </div>
                        </label>
                        <textarea value={formData.credentialsJson} onChange={e => handleFieldChange("credentialsJson", e.target.value)} rows={5} className="block w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm shadow-inner transition-colors leading-relaxed" spellCheck={false}></textarea>
                        {formData.vaultMode === "cyberark" && <p className="text-[11px] text-slate-500 mt-2">Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-indigo-500 font-bold">{`{{VAULT_TOKEN}}`}</code> anywhere inside the JSON to dynamically inject the retrieved CyberArk token!</p>}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Server Host / IP</label>
                        <input required type="text" value={formData.dbHost} onChange={e => handleFieldChange("dbHost", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="10.0.0.51 or db.corp.internal" />
                      </div>
                      <div className="col-span-2 md:col-span-1 border-l pl-4 border-slate-100 dark:border-slate-800">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Port</label>
                        <input required type="text" value={formData.dbPort} onChange={e => handleFieldChange("dbPort", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="5432 or 3306" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Database Name / ORACLE SID</label>
                        <input required type="text" value={formData.dbName} onChange={e => handleFieldChange("dbName", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="production_metrics" />
                      </div>
                      <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1 grid grid-cols-2 gap-4">
                        {formData.vaultMode === "cyberark" ? (
                          <div className="col-span-2 space-y-4 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 mt-2">
                             <div>
                               <label className="block text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">CyberArk AppID</label>
                               <input required type="text" value={formData.caAppId} onChange={e => handleFieldChange("caAppId", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="App_DRC_Auth" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <label className="block text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">Target SafeName</label>
                                 <input required type="text" value={formData.caSafe} onChange={e => handleFieldChange("caSafe", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="DRC-PROD-DB" />
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">Target Object ID</label>
                                 <input required type="text" value={formData.caObject} onChange={e => handleFieldChange("caObject", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="db-account-01" />
                               </div>
                             </div>
                             <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold leading-tight">Zero-Trust dynamically retrieves the Vault password mapping milliseconds prior seamlessly to executing the physical payload.</p>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Username</label>
                              <input required type="text" value={formData.dbUser} onChange={e => handleFieldChange("dbUser", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="readonly_admin" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Password</label>
                              <input required type="password" value={formData.dbPassword} onChange={e => handleFieldChange("dbPassword", e.target.value)} className="block w-full px-3 py-2 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm" placeholder="••••••••" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && formData.usageType !== "ACTION" && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Database className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Stateful Query Protocol</h3>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400">Write the raw execution query this Data Source will endlessly pipe (e.g. SQL Statement, PromQL Object, or JSON extraction logic) natively passing to the Proxy compiler.</p>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      {isDb ? "SQL Statement" : "REST/Prometheus Endpoint Suffix Query"}
                    </label>
                    <textarea 
                      required 
                      value={formData.queryPayload} 
                      onChange={e => handleFieldChange("queryPayload", e.target.value)} 
                      rows={6} 
                      className="block w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-sm shadow-inner transition-colors" 
                      placeholder={isDb ? "SELECT hostname, cpu_usage, memory_usage FROM system_metrics LIMIT 10;" : "?query=node_cpu_seconds_total&step=1m"}
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}

              {step === 4 && formData.usageType !== "ACTION" && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <TimerReset className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Execution Config & Test</h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner max-w-sm mb-6">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 text-center">Data Polling Frequency (Seconds)</label>
                    <div className="flex items-center gap-4">
                      <input type="range" min="1" max="60" step="1" value={formData.refreshInterval} onChange={e => handleFieldChange("refreshInterval", Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      <div className="w-16 h-10 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 font-mono flex-shrink-0 shadow-inner">
                        {formData.refreshInterval}s
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button" 
                      disabled={isTesting || (!isDb && !formData.endpointURI) || (isDb && (!formData.dbHost || !formData.dbUser || !formData.dbPassword || !formData.dbName))}
                      onClick={async () => {
                        setIsTesting(true);
                        setTestResult(null);
                        try {
                          let finalURI = formData.endpointURI
                          let finalCreds = formData.credentialsJson

                          if (formData.vaultMode === "cyberark") {
                            if (isDb) {
                              finalCreds = JSON.stringify({
                                host: formData.dbHost,
                                port: formData.dbPort,
                                database: formData.dbName,
                                cyberArk: { appId: formData.caAppId, safe: formData.caSafe, objectName: formData.caObject }
                              })
                            } else {
                              let existing: any = {}
                              try { existing = JSON.parse(finalCreds) } catch(e) {}
                              existing.cyberArk = { appId: formData.caAppId, safe: formData.caSafe, objectName: formData.caObject }
                              finalCreds = JSON.stringify(existing)
                            }
                          } else {
                            if (isDb) {
                              finalCreds = JSON.stringify({
                                host: formData.dbHost,
                                port: formData.dbPort,
                                database: formData.dbName,
                                user: formData.dbUser,
                                password: formData.dbPassword
                              })
                            }
                          }

                          const res = await fetch("/api/cms/test-source", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              type: formData.type,
                              endpointURI: finalURI,
                              credentialsJson: finalCreds,
                              queryPayload: formData.queryPayload
                            })
                          })
                          const json = await res.json()
                          setTestResult(JSON.stringify(json.data, null, 2))
                        } catch (err: any) {
                          setTestResult(`Error: ${err.message}`)
                        } finally {
                          setIsTesting(false)
                        }
                      }}
                      className="w-full py-3 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-50 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                    >
                      {isTesting ? "Testing Connection..." : "Preview Connection Payload"}
                    </button>
                    
                    {testResult && (
                      <div className="mt-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/90 backdrop-blur-sm rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          Data Processor Result Payload (JSON)
                        </div>
                        <div className="h-64 overflow-auto p-4 custom-scrollbar">
                          <pre className="text-[12px] font-mono leading-relaxed text-indigo-800 dark:text-indigo-300">
                            {testResult}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto flex-shrink-0">
                <button type="button" onClick={() => step === 1 ? setIsOpen(false) : handlePrev()} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                  {step === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4" /> Back</>}
                </button>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting || (step === 1 && !formData.name) || (step === 2 && !isDb && !formData.endpointURI) || (step === 2 && isDb && (!formData.dbHost || !formData.dbUser || !formData.dbPassword || !formData.dbName))}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/20 dark:shadow-indigo-500/20"
                >
                  {isSubmitting ? "Finalizing Mappings..." : step === totalSteps ? "Build Data Source" : <>Next Step <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}
