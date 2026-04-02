import { ShieldAlert, Database, Fingerprint, Layers, ChevronRight, LayoutTemplate, Server, Key } from "lucide-react"
import { Link } from "@/i18n/routing"

export default function AdminLaunchpad() {
  const adminModules = [
    {
      title: "CMS Configuration",
      description: "Manage dynamic payload interfaces, layouts, and navigables.",
      href: "/admin/pages",
      icon: <Layers className="w-8 h-8 text-indigo-400" />,
      bgIcon: <LayoutTemplate className="w-32 h-32 absolute -right-6 -bottom-6 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />,
      border: "border-indigo-500/20 hover:border-indigo-500/50"
    },
    {
      title: "Data Sources",
      description: "Bind securely managed system endpoints natively inside the backend Node environment.",
      href: "/admin/sources",
      icon: <Database className="w-8 h-8 text-emerald-400" />,
      bgIcon: <Database className="w-32 h-32 absolute -right-6 -bottom-6 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors" />,
      border: "border-emerald-500/20 hover:border-emerald-500/50"
    },
    {
      title: "Role-Based Access",
      description: "Map Active Directory Group & User arrays explicitly against Application privileges natively.",
      href: "/admin/roles",
      icon: <ShieldAlert className="w-8 h-8 text-amber-400" />,
      bgIcon: <ShieldAlert className="w-32 h-32 absolute -right-6 -bottom-6 text-amber-500/5 group-hover:text-amber-500/10 transition-colors" />,
      border: "border-amber-500/20 hover:border-amber-500/50"
    },
    {
      title: "LDAP Settings",
      description: "Configure Active Directory syncing and SSO SAML boundaries securely.",
      href: "/admin/ldap",
      icon: <Fingerprint className="w-8 h-8 text-purple-400" />,
      bgIcon: <Fingerprint className="w-32 h-32 absolute -right-6 -bottom-6 text-purple-500/5 group-hover:text-purple-500/10 transition-colors" />,
      border: "border-purple-500/20 hover:border-purple-500/50"
    },
    {
      title: "System Architecture",
      description: "Live monitor and shift Database Schema boundaries dynamically natively (Migration Controller).",
      href: "/admin/system",
      icon: <Server className="w-8 h-8 text-blue-400" />,
      bgIcon: <Server className="w-32 h-32 absolute -right-6 -bottom-6 text-blue-500/5 group-hover:text-blue-500/10 transition-colors" />,
      border: "border-blue-500/20 hover:border-blue-500/50"
    },
    {
      title: "CyberArk Vault Integration",
      description: "Manage physical Enterprise Central Credential logic bypassing environment variables securely globally.",
      href: "/admin/vault",
      icon: <Key className="w-8 h-8 text-rose-400" />,
      bgIcon: <Key className="w-32 h-32 absolute -right-6 -bottom-6 text-rose-500/5 group-hover:text-rose-500/10 transition-colors" />,
      border: "border-rose-500/20 hover:border-rose-500/50"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-slate-500 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Admin & Configuration</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl mx-auto">
              Select an administrative core module to configure dynamic logic handlers, architecture endpoints, or security bindings explicitly.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((mod, i) => (
            <Link 
              key={i} 
              href={mod.href}
              className={`group relative overflow-hidden bg-white dark:bg-slate-900 border ${mod.border} rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 flex flex-col h-full z-10 shadow-sm`}
            >
              {mod.bgIcon}
              
              <div className="bg-slate-50/50 dark:bg-slate-950/50 w-16 h-16 rounded-xl flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 mb-6 shadow-sm dark:shadow-inner z-20">
                {mod.icon}
              </div>

              <div className="z-20 flex-1">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {mod.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {mod.description}
                </p>
              </div>

              <div className="z-20 mt-8 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Launch Module <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
