import { Link } from "@/i18n/routing";
import { Activity, Server } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function CommandCenter() {
  const t = await getTranslations('CommandCenter');
  const d = await getTranslations('Dashboard');
  const n = await getTranslations('Navigation');
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          {t('title')}
        </h1>
        <p className="mt-4 text-xl text-slate-400">
          {t('desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        <Link href="/dashboard" className="group block">
          <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300">
            <div className="rounded-xl w-14 h-14 bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-200 mb-3 group-hover:text-blue-400 transition-colors">
              {d('title')}
            </h3>
            <p className="text-slate-400 flex-grow leading-relaxed">
              Draggable grid interface offering high-level visibility over Oracle database transitions, network stats, and operational vs pending states.
            </p>
          </div>
        </Link>

        <Link href="/infrastructure" className="group block">
          <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-300">
            <div className="rounded-xl w-14 h-14 bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Server className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-200 mb-3 group-hover:text-indigo-400 transition-colors">
              {n('infrastructure')}
            </h3>
            <p className="text-slate-400 flex-grow leading-relaxed">
              High-density, master-detail table featuring real-time synchronization progress, technology stack information, and live host logs.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
