import { Key, ArrowLeft, CheckCircle, ShieldAlert, Plus, Trash2, Server } from "lucide-react"
import { Link } from "@/i18n/routing"
import { prisma } from "@/lib/prisma"
import { encryptString, decryptString } from "@/lib/encryption"
import { revalidatePath } from "next/cache"

export default async function CyberArkVaultPage() {
  // Graceful fallback during active Next.js database rebuilding sequences natively
  const isPrismaReady = !!prisma.vaultIntegration
  const vaults = isPrismaReady ? await prisma.vaultIntegration.findMany({ orderBy: { createdAt: 'desc' } }).catch(()=>[]) : []

  async function createVaultIntegration(formData: FormData) {
    "use server"
    if (!prisma.vaultIntegration) return

    const name = (formData.get("name") as string).trim() || "Target Corporate Vault"
    const cyberarkApiUrl = (formData.get("cyberarkApiUrl") as string).trim()
    const vaultAppId = (formData.get("vaultAppId") as string).trim()
    const vaultUsername = (formData.get("vaultUsername") as string).trim()
    const vaultPasswordRaw = (formData.get("vaultPassword") as string).trim()

    const encryptedPassword = vaultPasswordRaw ? encryptString(vaultPasswordRaw) : ""

    await prisma.vaultIntegration.create({
      data: { name, cyberarkApiUrl, vaultAppId, vaultUsername, vaultPassword: encryptedPassword }
    })

    revalidatePath('/[locale]/admin/vault', 'page')
  }

  async function deleteVaultIntegration(formData: FormData) {
    "use server"
    if (!prisma.vaultIntegration) return
    const id = formData.get("id") as string
    await prisma.vaultIntegration.delete({ where: { id } })
    revalidatePath('/[locale]/admin/vault', 'page')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                CyberArk Connections
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Zero-Trust Central Credential Provider Multi-Tenant Routing Engine.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium transition-colors shadow-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Admin
            </Link>
          </div>
        </header>

        {!isPrismaReady && (
           <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3">
              <ShieldAlert className="w-6 h-6" />
              <div className="flex-1">
                 <h4 className="font-bold">Next.js Development Engine Restart Required</h4>
                 <p className="text-sm">The framework has structurally modified the internal database dynamically. Please execute `npm run dev` physically in the terminal again to attach the Prisma bindings.</p>
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                 <Server className="w-5 h-5 text-indigo-500" /> Active Vault Clusters
              </h3>
              
              {vaults.length === 0 ? (
                 <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <Key className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                    <h4 className="text-lg font-bold text-slate-400 dark:text-slate-500">No Enterprise Vaults Synchronized</h4>
                    <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mt-2">Construct a target CyberArk CCP vector to seamlessly map database secrets globally securely natively.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vaults.map(vault => (
                       <div key={vault.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                          
                          <div className="flex items-start justify-between mb-4 relative z-10">
                             <div>
                               <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{vault.name}</h4>
                               <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-1 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded w-fit">AppID: {vault.vaultAppId}</p>
                             </div>
                             <form action={deleteVaultIntegration}>
                               <input type="hidden" name="id" value={vault.id} />
                               <button type="submit" className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </form>
                          </div>
                          
                          <div className="space-y-3 relative z-10">
                             <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Gateway Endpoint</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-mono truncate">{vault.cyberarkApiUrl}</p>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Bound Username</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-mono truncate">{vault.vaultUsername || "N/A"}</p>
                             </div>
                             {vault.vaultPassword && (
                               <div className="inline-block mt-2">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 rounded flex items-center gap-1.5">
                                    <ShieldAlert className="w-3 h-3" /> SECURED AES-256
                                  </span>
                               </div>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>

           <div>
              <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 p-6 rounded-2xl shadow-sm sticky top-10">
                 <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-6">
                    <Plus className="w-5 h-5 text-indigo-500" /> Append New Vault
                 </h3>
                 
                 <form action={createVaultIntegration} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1 tracking-wide">Identification Name</label>
                        <input required name="name" placeholder="Production Infrastructure" className="w-full bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2.5 font-sans text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1 tracking-wide">REST Gateway Network URL</label>
                        <input required name="cyberarkApiUrl" placeholder="https://ccp.cyberark.local" className="w-full bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1 tracking-wide">Target AppID</label>
                        <input required name="vaultAppId" placeholder="App_DRC_Auth" className="w-full bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
                    </div>

                    <div className="border-t border-indigo-200/50 dark:border-indigo-500/20 pt-4 mt-4">
                        <label className="block text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1 tracking-wide">Active Directory User</label>
                        <input name="vaultUsername" placeholder="api_bridge_svc" className="w-full bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1 tracking-wide">User Secret</label>
                        <input name="vaultPassword" type="password" placeholder="••••••••" className="w-full bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
                    </div>

                    <button type="submit" disabled={!isPrismaReady} className="w-full mt-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Bind Architecture Element
                    </button>
                 </form>
              </div>
           </div>

        </div>

      </div>
    </div>
  )
}
