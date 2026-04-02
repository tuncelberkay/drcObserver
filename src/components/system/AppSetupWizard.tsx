"use client"

import { useState } from "react"
import { Database, Server, Rocket, Loader2, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function AppSetupWizard({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<"sqlite" | "postgresql" | "mysql" | "oracle">("sqlite")
  const [connUrl, setConnUrl] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const handleLaunch = async () => {
    try {
      setLoading(true)
      setErrorMsg("")
      
      const res = await fetch("/api/system/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, url: provider === "sqlite" ? "file:./dev.db" : connUrl })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Execution failed.")
      }
      
      // Artificial delay allowing PM2/Docker to reload NextJS process natively
      setTimeout(() => {
        window.location.reload()
      }, 5000)
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to configure engine")
      setLoading(false)
    }
  }

  return (
    <div className={`${embedded ? 'min-h-[600px] flex items-center justify-center bg-slate-950' : 'min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6'} text-slate-200`}>
      <div className={`w-full ${embedded ? 'max-w-full rounded-none border-0' : 'max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl'} overflow-hidden animate-in zoom-in-95 duration-500`}>
        
        {/* Banner Area */}
        <div className="h-40 bg-gradient-to-br from-indigo-900 to-slate-950 border-b border-slate-800 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <Rocket className="w-16 h-16 text-indigo-400 absolute opacity-20 -right-4 -bottom-4 translate-y-3" />
          <div className="text-center z-10">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Server className="w-8 h-8 text-indigo-400" />
              DRC Framework Initializer
            </h1>
            <p className="text-slate-400 font-medium mt-2">Core System Architecture Validation</p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-6">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-slate-100">Configuring Prisma Matrix...</h3>
            <p className="text-sm text-slate-400">Rewriting physical schemas and waiting for node regeneration bounds gracefully. The system will automatically refresh upon compilation...</p>
          </div>
        ) : (
          <div className="p-8 space-y-8 flex flex-col">
          
            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold rounded-lg text-center shadow-inner">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" /> 1. Select Database Architecture Profile
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setProvider("sqlite")} className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${provider === "sqlite" ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                  <h4 className="font-bold text-slate-200 text-base mb-1">Local Virtual Sandbox</h4>
                  <p className="text-xs text-slate-400">Uses internal embedded SQLite DB. Safe for prototyping.</p>
                </div>
                
                <div onClick={() => setProvider("postgresql")} className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${provider === "postgresql" ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                  <h4 className="font-bold text-slate-200 text-base mb-1">PostgreSQL Enterprise</h4>
                  <p className="text-xs text-slate-400">Robust distributed environment optimized for massive metrics.</p>
                </div>

                <div onClick={() => setProvider("mysql")} className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${provider === "mysql" ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                  <h4 className="font-bold text-slate-200 text-base mb-1">MySQL Native Flow</h4>
                  <p className="text-xs text-slate-400">Relational mappings optimized natively globally globally.</p>
                </div>

                <div onClick={() => setProvider("oracle")} className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${provider === "oracle" ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                  <h4 className="font-bold text-slate-200 text-base mb-1">Oracle Core Matrix</h4>
                  <p className="text-xs text-slate-400">Financial and heavy-lift corporate infrastructure layers.</p>
                </div>
              </div>
            </div>

            {provider !== "sqlite" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" /> 2. Connection Identity Schema
                </h3>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prisma Native Database URL</label>
                  <input 
                    type="text" 
                    value={connUrl} 
                    onChange={e => setConnUrl(e.target.value)} 
                    placeholder={`e.g. ${provider}://user:password@localhost:5432/mydb?schema=public`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm font-mono focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <button 
              onClick={handleLaunch} 
              disabled={provider !== "sqlite" && connUrl.trim() === ""}
              className="mt-6 w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              Synthesize Infrastructure Engine <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
