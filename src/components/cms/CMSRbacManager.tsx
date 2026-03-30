"use client"

import { useState } from "react"
import { Shield, Plus, X, Users, Trash2, ShieldCheck, Lock, Webhook, Check, Fingerprint, Database, Layout, ShieldAlert } from "lucide-react"
import { createAppRole, deleteAppRole, updateAppRolePermissions, createAppRoleBinding, deleteAppRoleBinding } from "@/app/actions/rbac"

const SYSTEM_MODULES = [
  { id: "ADMIN_MODULE_PAGES", label: "CMS Route Configuration", icon: <Layout className="w-3.5 h-3.5" /> },
  { id: "ADMIN_MODULE_SOURCES", label: "Data Source Control Engine", icon: <Database className="w-3.5 h-3.5" /> },
  { id: "ADMIN_MODULE_LDAP", label: "LDAP Architecture Hook", icon: <Fingerprint className="w-3.5 h-3.5" /> },
  { id: "ADMIN_MODULE_ROLES", label: "Enterprise RBAC Bounds", icon: <ShieldAlert className="w-3.5 h-3.5" /> }
]

export function CMSRbacManager({ roles, pages }: { roles: any[], pages: any[] }) {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [roleName, setRoleName] = useState("")
  const [roleDesc, setRoleDesc] = useState("")
  
  const [bindRoleTarget, setBindRoleTarget] = useState<string | null>(null)
  const [bindType, setBindType] = useState<"GROUP" | "USER">("GROUP")
  const [bindIdentifier, setBindIdentifier] = useState("")

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName) return
    try {
      await createAppRole(roleName, roleDesc, "[]")
      setIsRoleModalOpen(false)
      setRoleName("")
      setRoleDesc("")
    } catch {
      alert("Failed to create role")
    }
  }

  const handleCreateBinding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bindRoleTarget || !bindIdentifier) return
    try {
      await createAppRoleBinding(bindRoleTarget, bindType, bindIdentifier)
      setBindRoleTarget(null)
      setBindIdentifier("")
    } catch {
      alert("Failed to bind role")
    }
  }

  const handleTogglePermission = async (roleId: string, currentJson: string, pageSlug: string) => {
    const perms = JSON.parse(currentJson || "[]")
    const hasPerm = perms.includes(pageSlug)
    const newPerms = hasPerm ? perms.filter((p: string) => p !== pageSlug) : [...perms, pageSlug]
    await updateAppRolePermissions(roleId, JSON.stringify(newPerms))
  }

  return (
    <div className="space-y-12">
      
      <div className="flex justify-between items-center -mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Active System Roles
          </h2>
          <p className="text-sm text-slate-400 mt-1">Determine the boundaries explicitly governing logical routing capabilities.</p>
        </div>
        <button 
          onClick={() => setIsRoleModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Create App Role
        </button>
      </div>

      {roles.map(role => {
        const rolePerms = JSON.parse(role.permissionsJson || "[]")
        
        return (
          <div key={role.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950/50 p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-3">
                  <Shield className="w-6 h-6 text-indigo-500" /> {role.name}
                </h3>
                {role.description && <p className="text-sm text-slate-400 mt-1 font-medium">{role.description}</p>}
              </div>
              <button onClick={() => deleteAppRole(role.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-2 hover:bg-rose-500/10 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              
              {/* PAGE PERMISSIONS LIST */}
              <div className="p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-emerald-500" /> Page Access Matrix
                </h4>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {pages.map(page => {
                    const isActive = rolePerms.includes(page.slug)
                    return (
                      <div 
                        key={page.id} 
                        onClick={() => handleTogglePermission(role.id, role.permissionsJson, page.slug)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 shadow-inner' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                      >
                        <span className={`font-mono text-sm ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}>/p/{page.slug}</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'}`}>
                          {isActive && <Check className="w-3.5 h-3.5 font-bold" />}
                        </div>
                      </div>
                    )
                  })}
                  {pages.length === 0 && <p className="text-xs text-slate-500 italic">No CMS pages configured.</p>}
                </div>

                <div className="h-px bg-slate-800 w-full my-4" />

                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4 mt-6">
                  <ShieldAlert className="w-4 h-4 text-purple-500" /> Core Admin Modules
                </h4>
                <div className="space-y-2">
                  {SYSTEM_MODULES.map(sys => {
                    const isActive = rolePerms.includes(sys.id)
                    return (
                      <div 
                        key={sys.id} 
                        onClick={() => handleTogglePermission(role.id, role.permissionsJson, sys.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isActive ? 'bg-purple-500/10 border-purple-500/30 shadow-inner' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                      >
                        <div className={`flex items-center gap-2 text-sm font-bold ${isActive ? 'text-purple-300' : 'text-slate-400'}`}>
                          {sys.icon} {sys.label}
                        </div>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700 bg-slate-900'}`}>
                          {isActive && <Check className="w-3.5 h-3.5 font-bold" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* BINDINGS MAPPING */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" /> Identity Bindings
                  </h4>
                  <button onClick={() => setBindRoleTarget(role.id)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded">
                    <Plus className="w-3 h-3" /> New Bind
                  </button>
                </div>
                
                <div className="space-y-2">
                  {role.bindings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 group">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded ${b.bindType === 'GROUP' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'}`}>
                          {b.bindType}
                        </span>
                        <span className="text-sm font-mono text-slate-300 truncate max-w-[200px]" title={b.identifier}>{b.identifier}</span>
                      </div>
                      <button onClick={() => deleteAppRoleBinding(b.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {role.bindings.length === 0 && <p className="text-xs text-slate-500 italic">No exact Active Directory bounds attached to this role.</p>}
                </div>
              </div>

            </div>
          </div>
        )
      })}

      {roles.length === 0 && (
        <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-300">No Application Roles Modeled</h3>
          <p className="text-slate-500">Create an App Role explicitly mapping layout schemas correctly into Active Directory natively.</p>
        </div>
      )}

      {/* NEW ROLE MODAL */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-400"/> Create Role</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role Title</label>
                <input required type="text" value={roleName} onChange={e => setRoleName(e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g. NOC Monitor" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                <input type="text" value={roleDesc} onChange={e => setRoleDesc(e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Can only view dashboards..." />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={!roleName} className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">Build Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BINDING MODAL */}
      {bindRoleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Webhook className="w-5 h-5 text-amber-400"/> New Identity Binding</h2>
              <button onClick={() => setBindRoleTarget(null)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateBinding} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Bind Target Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <div onClick={() => setBindType("GROUP")} className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${bindType === 'GROUP' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}>AD GROUP</div>
                  <div onClick={() => setBindType("USER")} className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${bindType === 'USER' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}>SINGLE AD USER</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Object Identifier</label>
                <input required type="text" value={bindIdentifier} onChange={e => setBindIdentifier(e.target.value)} className="block w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-sm" placeholder={bindType === 'GROUP' ? "CN=Ops,OU=Groups..." : "sAMAccountName (e.g. jdoe)"} />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={!bindIdentifier} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-sm font-bold transition-colors">Attach Binding</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
