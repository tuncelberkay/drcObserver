import { prisma } from "@/lib/prisma"
import { ShieldAlert, Plus, Layout, Layers, Link as LinkIcon } from "lucide-react"
import { Link } from "@/i18n/routing"
import { CMSPageModal } from "@/components/cms/CMSPageModal"
import { NavigationOrderModal } from "@/components/cms/NavigationOrderModal"

export default async function CMSAdminPages() {
  const pages = await prisma.appPage.findMany({
    include: {
      widgets: true,
      Navigation: true
    }
  })

  const navItemsRaw = await prisma.appNavigation.findMany({
    orderBy: { sortOrder: 'asc' }
  })
  
  const navItems = navItemsRaw.map(n => ({
    id: n.id,
    label: n.label,
    path: n.path,
    sortOrder: n.sortOrder
  }))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">CMS Configuration</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage dynamic payload interfaces & navigables</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium transition-colors shadow-sm">
              Back to Admin
            </Link>
            <NavigationOrderModal items={navItems} />
            <CMSPageModal />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {pages.map(page => (
            <div key={page.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all shadow-sm">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">/p/{page.slug}</h3>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {page.layoutType} Layout
                  </span>
                </div>
                <p className="text-sm font-mono text-slate-500 dark:text-slate-400 line-clamp-1">{page.title}</p>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                  <span className="text-slate-500 mb-1 flex items-center gap-1.5 font-medium"><Layers className="w-3.5 h-3.5" /> Widgets</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{page.widgets.length}</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                  <span className="text-slate-500 mb-1 flex items-center gap-1.5 font-medium"><LinkIcon className="w-3.5 h-3.5" /> Navs</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{page.Navigation.length}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
                <Link href={`/p/${page.slug}`} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors text-center flex items-center justify-center gap-2 border border-slate-200 dark:border-transparent">
                  <Layout className="w-4 h-4" /> View Live
                </Link>
                <Link href={`/admin/editor/${page.id}`} className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700 text-center flex justify-center items-center shadow-sm">
                  Edit Layout
                </Link>
                <form action={async () => {
                  "use server"
                  const { deleteAppPage } = await import('@/app/actions/cms')
                  await deleteAppPage(page.id)
                }}>
                  <button type="submit" className="px-3 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-lg transition-colors border border-rose-200 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/50 flex items-center justify-center shadow-sm">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}

          {pages.length === 0 && (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              <Layers className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No CMS pages configured</h3>
              <p className="text-slate-500">Create a new dynamic page to bind it to the DRC routing layer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
