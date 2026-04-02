import { Server, ArrowLeft, RefreshCw, Key, DatabaseBackup, CheckCircle, AlertTriangle } from "lucide-react"
import { Link } from "@/i18n/routing"
import { AppSetupWizard } from "@/components/system/AppSetupWizard"
import { getSystemConfig } from "@/lib/drc-config"
import fs from 'fs'
import path from 'path'

export default async function SystemArchitecturePage() {
  const config = getSystemConfig()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                System Architecture
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                Current Topology: <span className="uppercase font-bold text-blue-600 dark:text-blue-400 ml-1">{config.dbProvider}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium transition-colors shadow-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Admin
            </Link>
          </div>
        </header>

        {fs.existsSync(path.join(process.cwd(), 'drc-migration-dump.json')) && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-2xl shadow-sm space-y-4 flex flex-col md:flex-row md:items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <DatabaseBackup className="w-6 h-6 text-amber-600 dark:text-amber-400" /> Pending Data Hydration Detected
              </h3>
              <p className="text-amber-700 dark:text-amber-400 text-sm max-w-2xl font-medium">
                A Database execution architecture schema shift occurred recently. A pristine structural JSON array containing the former 
                database's CMS topologies natively exists. Would you like to restore those layouts cleanly?
              </p>
            </div>
            
            <form action={async () => {
              "use server"
              const { prisma } = await import('@/lib/prisma')
              const dumpPath = path.join(process.cwd(), 'drc-migration-dump.json')
              if (!fs.existsSync(dumpPath)) return
              
              const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'))
              
              // Simple sequential execution mapping restoring architectures dynamically natively safely cleanly.
              try {
                if (dump.pages) await prisma.appPage.createMany({ data: dump.pages }).catch(()=>null)
                if (dump.navs) await prisma.appNavigation.createMany({ data: dump.navs }).catch(()=>null)
                if (dump.widgets) await prisma.appWidget.createMany({ data: dump.widgets }).catch(()=>null)
                if (dump.sources) await prisma.appDataSource.createMany({ data: dump.sources }).catch(()=>null)
                if (dump.roles) await prisma.appRole.createMany({ data: dump.roles }).catch(()=>null)
                if (dump.bindings) await prisma.appRoleBinding.createMany({ data: dump.bindings }).catch(()=>null)
                if (dump.users) await prisma.user.createMany({ data: dump.users }).catch(()=>null)
                if (dump.accounts) await prisma.account.createMany({ data: dump.accounts }).catch(()=>null)
                if (dump.sessions) await prisma.session.createMany({ data: dump.sessions }).catch(()=>null)
                if (dump.ldap) await prisma.ldapConfig.createMany({ data: dump.ldap }).catch(()=>null)
                if (dump.hosts) await prisma.hostMetric.createMany({ data: dump.hosts }).catch(()=>null)

                fs.unlinkSync(dumpPath) // Purge safely
              } catch(e) {
                console.error("Hydration fault:", e)
              }
            }}>
              <button type="submit" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Execute Live Data Restore
              </button>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Native Infrastructure Migration</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
              You can trigger a manual First Flight system reconfiguration cleanly. Re-structuring the Native Prisma framework involves dropping the current Node execution mapping correctly seamlessly and dynamically patching core drivers natively.
            </p>
          </div>
          
          <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 mt-8 relative">
            <AppSetupWizard embedded={true} />
          </div>
        </div>

      </div>
    </div>
  )
}
