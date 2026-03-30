import { Fingerprint, Users, PowerOff, Settings2, FileWarning } from "lucide-react"
import { Link } from "@/i18n/routing"
import { PrismaClient } from '@prisma/client'
import { CMSLdapForm } from "@/components/cms/CMSLdapForm"

const prisma = new PrismaClient()

export default async function CMSAdminLDAP() {
  const ldapConfig = await prisma.ldapConfig.findUnique({
    where: { id: "singleton" }
  })

  // Strip password payload from the payload before sending to client for high-security boundaries
  const safeData = ldapConfig ? { ...ldapConfig, bindPassword: ldapConfig.bindPassword ? "REDACTED" : "" } : null

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${ldapConfig?.isActive ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
              {ldapConfig?.isActive ? <Settings2 className="w-6 h-6 text-emerald-400" /> : <Fingerprint className="w-6 h-6 text-purple-400" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <span className="text-slate-100">LDAP Configuration</span>
                {ldapConfig?.isActive ? (
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 rounded-full animate-pulse">ACTIVE</span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest bg-slate-800 text-slate-500 border border-slate-700 rounded-full">OFFLINE</span>
                )}
              </h1>
              <p className="text-slate-400 mt-1">Active Directory single sign-on parameters and System Role assignments.</p>
            </div>
          </div>
          <Link href="/admin" className="px-4 py-2 border border-slate-700 bg-slate-900 hover:bg-slate-800 rounded-lg text-sm text-slate-300 font-medium transition-colors hidden md:block">
            Back to Launchpad
          </Link>
        </header>

        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl flex flex-col md:flex-row items-start gap-4 text-sm mb-8 shadow-inner">
          <FileWarning className="w-7 h-7 text-amber-500 flex-shrink-0 mt-0.5 hidden sm:block" />
          <div className="flex-1">
            <strong className="text-amber-500 block mb-1">Architecture Readout Notice:</strong> 
            <p className="text-amber-200/80 leading-relaxed max-w-4xl">
              Applying values perfectly dynamically enables Next-Auth to explicitly execute native Active Directory fetches resolving User schemas mapped explicitly mapping "Groups" directly to System Permissions. When enforced offline, NextAuth falls back explicitly ignoring payloads.
            </p>
          </div>
        </div>

        <CMSLdapForm initialData={safeData} />

      </div>
    </div>
  )
}
