import { Shield, Fingerprint, Lock } from "lucide-react"
import { Link } from "@/i18n/routing"
import { PrismaClient } from '@prisma/client'
import { CMSRbacManager } from "@/components/cms/CMSRbacManager"

const prisma = new PrismaClient()

export default async function CMSAdminRoles() {
  const roles = await prisma.appRole.findMany({
    include: {
      bindings: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const pages = await prisma.appPage.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10`}>
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
                Role-Based Access Control
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Enterprise mapping definitions segregating Group and User UI matrixes exclusively.</p>
            </div>
          </div>
          <Link href="/admin" className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium transition-colors hidden md:block shadow-sm">
            Back to Launchpad
          </Link>
        </header>

        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-5 rounded-xl flex flex-col md:flex-row items-start gap-4 text-sm mb-8 shadow-inner">
          <Lock className="w-7 h-7 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5 hidden sm:block" />
          <div className="flex-1">
            <strong className="text-indigo-700 dark:text-indigo-400 block mb-1">Decoupled RBAC Execution Notice:</strong> 
            <p className="text-indigo-600/80 dark:text-indigo-200/80 leading-relaxed max-w-4xl">
              Roles created here strictly control specific `AppPages`. You securely map Active Directory payloads directly onto Roles internally bridging capabilities visually out-of-the-box perfectly separating LDAP architectures from internal System schemas logically.
            </p>
          </div>
        </div>

        <CMSRbacManager roles={roles} pages={pages} />

      </div>
    </div>
  )
}
