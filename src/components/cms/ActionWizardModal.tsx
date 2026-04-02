"use client"

import { useState, useEffect } from "react"
import { Database, Plus, X, Server, Code, Settings, Webhook, ChevronRight, ChevronLeft, Save } from "lucide-react"
import { getActionDataSources } from "@/app/actions/cms"

export function ActionWizardModal({ 
  onClose, 
  onFinish
}: { 
  onClose: () => void, 
  onFinish: (action: any) => void
}) {
  const [step, setStep] = useState(1)
  const [availableDataSources, setAvailableDataSources] = useState<any[]>([])

  useEffect(() => {
    getActionDataSources().then(res => setAvailableDataSources(res)).catch(e => console.error(e))
  }, [])
  
  // State for Wizard
  const [actionType, setActionType] = useState<"API" | "DB">("API")
  const [actionName, setActionName] = useState("")
  
  // Unified Action State
  const [dataSourceId, setDataSourceId] = useState("")

  // API Protocol Properties 
  const [apiMethod, setApiMethod] = useState("POST")
  const [apiEndpoint, setApiEndpoint] = useState("")
  const [apiPayload, setApiPayload] = useState("")

  // DB Protocol Properties
  const [dbQueryTemplate, setDbQueryTemplate] = useState("")

  const handleNext = () => setStep(s => Math.min(s + 1, 3))
  const handlePrev = () => setStep(s => Math.max(s - 1, 1))

  const isStep1Valid = actionName.length > 0;
  const isStep2Valid = actionType === "API" ? (dataSourceId !== "") : (dataSourceId !== "" && dbQueryTemplate.length > 0);

  const handleSubmit = () => {
    const finalPayload: any = {
      name: actionName,
      type: actionType,
      dataSourceId: dataSourceId,
    }

    if (actionType === "API") {
      finalPayload.method = apiMethod
      finalPayload.endpoint = apiEndpoint
      if (apiPayload) finalPayload.payloadTemplate = apiPayload;
    } else {
      finalPayload.method = "DB_EXECUTE"
      finalPayload.payloadTemplate = dbQueryTemplate
    }

    onFinish(finalPayload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Add Action Endpoint</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex h-1 bg-slate-100 dark:bg-slate-800 w-full flex-shrink-0">
          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Dynamic Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Settings className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Action Classification</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name (Button Label)</label>
                <input required type="text" value={actionName} onChange={e => setActionName(e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner" placeholder="E.g. Restart Internal Pod" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Execution Protocol</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setActionType("API")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${actionType === "API" ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">External Client API</span>
                      <Webhook className={`w-5 h-5 ${actionType === "API" ? 'text-indigo-500' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-xs text-slate-500">Executes directly from the browser to an external REST endpoint.</p>
                  </div>

                  <div 
                    onClick={() => setActionType("DB")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${actionType === "DB" ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Database Action</span>
                      <Database className={`w-5 h-5 ${actionType === "DB" ? 'text-rose-500' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-xs text-slate-500">Executes securely on the server via an Action Controller datasource.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && actionType === "API" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Webhook className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Server Authentication Gateway</h3>
              </div>
              <p className="text-[12px] text-slate-500 italic pb-2">Tip: Use {"{bracket_notation}"} to dynamically inject row variables into payloads, endpoints, or properties.</p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Target API Data Controller</label>
                <select value={dataSourceId} onChange={e => setDataSourceId(e.target.value)} className="w-full text-sm p-3 bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-700 rounded-lg font-bold shadow-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer">
                  <option value="" disabled>-- Select Authenticated Action Source --</option>
                  {availableDataSources.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name} ({ds.type})</option>
                  ))}
                </select>
                {availableDataSources.length === 0 && (
                  <p className="text-xs text-rose-500 mt-2">No API ACTION datasources found! Define one in the Admin Sources tab securely to authorize.</p>
                )}
              </div>

              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">HTTP Method</label>
                  <select value={apiMethod} onChange={e => setApiMethod(e.target.value)} className="w-full text-sm p-3 bg-white dark:bg-black border border-slate-300 dark:border-slate-700 rounded-lg font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 appearance-none text-center">
                    <option>POST</option><option>GET</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Endpoint URI Suffix (Optional)</label>
                  <input type="text" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} className="w-full text-sm font-mono p-3 bg-white dark:bg-black border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200" placeholder="/trigger/restart/{id}" />
                </div>
              </div>

              <div>
                 <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">JSON Payload Template (Optional)</label>
                 <textarea rows={3} value={apiPayload} onChange={e => setApiPayload(e.target.value)} className="w-full text-sm font-mono p-4 bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 shadow-inner" placeholder='{"device": "{hostname}"}' spellCheck={false} />
              </div>
            </div>
          )}

          {step === 2 && actionType === "DB" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Database className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Server Backend Execution</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Linked Action Controller</label>
                <select value={dataSourceId} onChange={e => setDataSourceId(e.target.value)} className="w-full text-sm p-3 bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-700 rounded-lg font-bold shadow-sm outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200 cursor-pointer">
                  <option value="" disabled>-- Select a Write Datasource --</option>
                  {availableDataSources.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name} ({ds.type})</option>
                  ))}
                </select>
                {availableDataSources.length === 0 && (
                  <p className="text-xs text-rose-500 mt-2">No DB ACTION datasources found! Define one safely within Administration settings.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Execution Query Body</label>
                <p className="text-[11px] text-slate-500 italic pb-2">Variables systematically injected dynamically gracefully prior to execution flow natively.</p>
                <textarea rows={5} value={dbQueryTemplate} onChange={e => setDbQueryTemplate(e.target.value)} className="w-full text-sm font-mono p-4 bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200 shadow-inner" placeholder="UPDATE pods SET active=0 WHERE pod_id='{id}';" spellCheck={false} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50 dark:border-emerald-500/10">
                 <Save className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Ready to Commit Action</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Binding <strong>"{actionName}"</strong> to the telemetry widget using a parameterized {actionType} execution flow.
              </p>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <button type="button" onClick={() => step === 1 ? onClose() : handlePrev()} className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm hover:shadow">
            {step === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4" /> Back</>}
          </button>
          
          {step < 3 ? (
             <button 
                type="button"
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                onClick={handleNext}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all flex items-center gap-1 shadow-md shadow-indigo-600/20 active:scale-95"
             >
               Next Step <ChevronRight className="w-4 h-4" />
             </button>
          ) : (
             <button 
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95"
             >
               Finish & Bind
             </button>
          )}
        </div>

      </div>
    </div>
  )
}
