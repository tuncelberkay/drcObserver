"use client"

import { useState } from "react"
import { saveLdapConfig } from "@/app/actions/ldap"
import { Server, Users, KeyRound, Network, ToggleLeft, ToggleRight, CheckCircle2, LayoutTemplate } from "lucide-react"

export function CMSLdapForm({ initialData }: { initialData: any }) {
  const [formData, setFormData] = useState({
    serverUrl: initialData?.serverUrl || "ldap://",
    baseDn: initialData?.baseDn || "DC=corp,DC=internal",
    bindDn: initialData?.bindDn || "CN=svc-nextjs,OU=ServiceAccounts,DC=corp,DC=internal",
    bindPassword: "", // Empty for security
    userFilter: initialData?.userFilter || "(&(objectCategory=person)(sAMAccountName={{username}}))",
    isActive: initialData?.isActive || false
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await saveLdapConfig({
        serverUrl: formData.serverUrl,
        baseDn: formData.baseDn,
        bindDn: formData.bindDn,
        ...(formData.bindPassword ? { bindPassword: formData.bindPassword } : {}),
        userFilter: formData.userFilter,
        isActive: formData.isActive
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
      alert("Failed to save configuration.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* KILLSWITCH */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-inner">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Enforce LDAP Authentication</h3>
          <p className="text-sm text-slate-400 mt-1">When enabled, Next-Auth will route all login attempts to this directory structure.</p>
        </div>
        <button 
          type="button" 
          onClick={() => handleChange('isActive', !formData.isActive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${formData.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
        >
          {formData.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {formData.isActive ? "ACTIVE" : "INACTIVE"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CONNECTION SETTINGS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-slate-200">Connection Hooks</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Server URL</label>
            <input required type="text" value={formData.serverUrl} onChange={e => handleChange('serverUrl', e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner font-mono text-sm" placeholder="ldap://dc01.corp.internal:389" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Base DN</label>
            <input required type="text" value={formData.baseDn} onChange={e => handleChange('baseDn', e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors shadow-inner font-mono text-sm" placeholder="DC=corp,DC=internal" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-2">
              <KeyRound className="w-4 h-4" /> Service Account Binding
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Bind DN</label>
              <input required type="text" value={formData.bindDn} onChange={e => handleChange('bindDn', e.target.value)} className="block w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-sm" placeholder="CN=admin,DC=..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Bind Password {initialData?.bindPassword && "(Stored Securely)"}</label>
              <input type="password" value={formData.bindPassword} onChange={e => handleChange('bindPassword', e.target.value)} className="block w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-sm" placeholder={initialData?.bindPassword ? "•••••••• (Leave blank to keep)" : "••••••••"} />
            </div>
          </div>
        </div>

        {/* QUERY & PERMISSION SETTINGS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
            <Network className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-slate-200">Query & Roles</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between">
              Login Query Filter 
              <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 rounded">{"{{username}}"} injected natively</span>
            </label>
            <input required type="text" value={formData.userFilter} onChange={e => handleChange('userFilter', e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-indigo-300 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors shadow-inner font-mono text-sm" placeholder="(&(objectCategory=person)(sAMAccountName={{username}}))" />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800 flex justify-end">
        <button 
          type="submit" 
          disabled={saving}
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-base font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {saving ? "Deploying..." : saved ? <><CheckCircle2 className="w-5 h-5" /> Saved Globally</> : <><LayoutTemplate className="w-5 h-5" /> Save Configuration</>}
        </button>
      </div>

    </form>
  )
}
