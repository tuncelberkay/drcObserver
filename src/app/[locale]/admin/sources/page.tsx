import { PrismaClient } from "@prisma/client"
import { Database, Lock } from "lucide-react"
import { Link } from "@/i18n/routing"
import { CMSDataSourceModal } from "@/components/cms/CMSDataSourceModal"
import { CMSDataSourceList } from "@/components/cms/CMSDataSourceList"

const prisma = new PrismaClient()

export default async function CMSAdminSources() {
  // Fetch data sources
  const sources = await prisma.appDataSource.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Data Connections Section */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Data Connections</h2>
              <p className="text-slate-400 mt-1">Bind securely managed system endpoints natively securely.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 border border-slate-700 bg-slate-900 hover:bg-slate-800 rounded-lg text-sm text-slate-300 font-medium transition-colors">
              Back to Admin
            </Link>
            <CMSDataSourceModal />
          </div>
        </header>

        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4 mb-8 text-sm">
          <Lock className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/80 leading-relaxed">
            <strong className="text-amber-500">Security Notice:</strong> The connections declared here are executed safely on the backend node environment. 
            Ensure credentials exactly match standard <code>{`{"headers": {"Authorization": "Bearer XYZ"}}`}</code> JSON payload structures if bindings mandate HTTP auth checks.
          </p>
        </div>

        <CMSDataSourceList initialSources={sources} />

      </div>
    </div>
  )
}
