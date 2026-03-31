import { PrismaClient } from "@prisma/client"
import { notFound } from "next/navigation"
import { Server, Table, ChevronLeft, ShieldAlert } from "lucide-react"
import { Link } from "@/i18n/routing"
import { WidgetStoreItem } from "@/components/cms/WidgetStoreItem"
import { ActiveWidgetCard } from "@/components/cms/ActiveWidgetCard"

const prisma = new PrismaClient()

export default async function CMSLayoutEditor({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id, locale } = await params
  
  const page = await prisma.appPage.findUnique({
    where: { id },
    include: {
      widgets: {
        orderBy: { y: 'asc' },
        include: { dataSources: true } // grab deep connection string arrays
      }
    }
  })

  const globalSources = await prisma.appDataSource.findMany({
    orderBy: { name: 'asc' }
  })

  if (!page) {
    notFound()
  }

  const AVAILABLE_WIDGETS = [
    { key: "OBSERVABILITY_GRID", name: "Responsive Drag Grid", iconName: "Layout", desc: "A customizable matrix of charts." },
    { key: "MASTER_DETAIL_TABLE", name: "Telemetry Datatable", iconName: "Table", desc: "A deep-dive data table with live logs." },
    { key: "STAT_CARD", name: "KPI Stat Card", iconName: "Hash", desc: "A singular crucial metric indicator." },
    { key: "BAR_CHART", name: "Vertical Bar Matrix", iconName: "BarChart3", desc: "Comparative scale dataset charts." },
    { key: "PIE_CHART", name: "Distribution Pie", iconName: "PieChart", desc: "Visual dataset composition ring." },
    { key: "LINE_GRAPH", name: "Time-Series Flow", iconName: "LineChart", desc: "Historical tracking datasets." }
  ]

  // Fallback layout icons
  function Layout({ className }: { className?: string }) {
    return <Server className={className} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm rounded-lg transition-colors mr-2">
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-transparent flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Layout Editor: /p/{page.slug}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Bind widgets to the `{page.layoutType}` engine.</p>
            </div>
          </div>
          <Link href={`/p/${page.slug}`} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-sm font-semibold rounded-lg transition-colors">
            Preview Live Router
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Widgets (Canvas) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Active Structural Bindings</h3>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-[400px] flex flex-col gap-4 shadow-sm">
              {page.widgets.length === 0 ? (
                <div className="m-auto text-center p-8 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl w-full">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No components injected. Drag or click from the registry.</p>
                </div>
              ) : (
                page.widgets.map((w) => (
                  <ActiveWidgetCard key={w.id} widget={w} sources={globalSources} />
                ))
              )}
            </div>
          </div>

          {/* Widget Store (Sidebar) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Component Registry</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
              {AVAILABLE_WIDGETS.map(cw => (
                <WidgetStoreItem key={cw.key} widget={cw} pageId={page.id} sources={globalSources} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
