import { prisma } from "@/lib/prisma"
import { Database, Plus, RefreshCw, Key, Lock, ShieldAlert } from "lucide-react"
import { Link } from "@/i18n/routing"
import { CMSDataSourceList } from "@/components/cms/CMSDataSourceList"
import { CMSDataSourceModal } from "@/components/cms/CMSDataSourceModal"
import { getScopedRowLevelQueryFilter, getCmsUserSession } from "@/lib/cms-auth"
import { decryptString } from "@/lib/encryption"

export default async function CMSAdminSources() {
  const isolationFilter = await getScopedRowLevelQueryFilter()
  const session = await getCmsUserSession()

  // Fetch data sources securely
  const rawSources = await prisma.appDataSource.findMany({
    where: isolationFilter,
    orderBy: { createdAt: 'desc' }
  })

  const sources = rawSources.map(s => ({
    ...s,
    credentialsJson: decryptString(s.credentialsJson)
  }))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Data Connections Section */}
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Data Connections
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                Bind securely managed system endpoints natively securely.
                {session?.role !== "ADMIN" && <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] uppercase font-bold border border-rose-200 dark:border-rose-500/20 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Sandboxed Elements</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium transition-colors shadow-sm">
              Back to Admin
            </Link>
            <CMSDataSourceModal />
          </div>
        </header>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex items-start gap-4 mb-8 text-sm shadow-inner">
          <Lock className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
            <strong className="text-amber-700 dark:text-amber-500">Security Notice:</strong> The connections declared here are executed safely on the backend node environment. 
            Ensure credentials exactly match standard <code>{`{"headers": {"Authorization": "Bearer XYZ"}}`}</code> JSON payload structures if bindings mandate HTTP auth checks.
          </p>
        </div>

        <CMSDataSourceList initialSources={sources} />

      </div>
    </div>
  )
}
