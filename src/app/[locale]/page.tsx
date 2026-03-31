import { Link } from "@/i18n/routing";
import * as LucideIcons from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";

const parseTranslation = (jsonStr: string, locale: string) => {
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed[locale] || parsed["en"] || jsonStr;
  } catch {
    return jsonStr;
  }
};

const COLORS = [
  {
    border: "hover:border-blue-500",
    shadow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    hoverText: "group-hover:text-blue-400"
  },
  {
    border: "hover:border-indigo-500",
    shadow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    hoverText: "group-hover:text-indigo-400"
  },
  {
    border: "hover:border-emerald-500",
    shadow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    hoverText: "group-hover:text-emerald-400"
  },
  {
    border: "hover:border-amber-500",
    shadow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    hoverText: "group-hover:text-amber-400"
  }
];

export default async function CommandCenter() {
  const t = await getTranslations('CommandCenter');
  const locale = await getLocale();
  
  const navItems = await prisma.appNavigation.findMany({
    orderBy: { sortOrder: 'asc' }
  });

  // Filter out the home page and build card properties dynamically
  const cards = navItems.filter(item => item.path !== '/').map(item => {
    // Provide nice default descriptions for our core apps, else a generic fallback for CMS created ones
    const defaultDescriptions: Record<string, string> = {
       '/p/dashboard': "Draggable grid interface offering high-level visibility over Oracle database transitions, network stats, and operational vs pending states.",
       '/p/infrastructure': "High-density, master-detail table featuring real-time synchronization progress, technology stack information, and live host logs."
    };
    
    return {
      id: item.id,
      href: item.path,
      title: parseTranslation(item.label, locale),
      iconName: item.iconName,
      description: defaultDescriptions[item.path] || "Click to view this observability section and manage monitoring configurations."
    }
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="text-center max-w-3xl mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
          {t('title')}
        </h1>
        <p className="mt-4 text-xl text-slate-600 dark:text-slate-400">
          {t('desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        {cards.map((card, idx) => {
          const IconCmp = (LucideIcons as any)[card.iconName] || LucideIcons.File;
          const color = COLORS[idx % COLORS.length];
          
          return (
            <Link key={card.id} href={card.href} className="group block">
              <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 transition-all duration-300 shadow-sm ${color.border} ${color.shadow}`}>
                <div className={`rounded-xl w-14 h-14 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${color.bg}`}>
                  <IconCmp className={`w-7 h-7 ${color.text}`} />
                </div>
                <h3 className={`text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3 transition-colors ${color.hoverText}`}>
                  {card.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 flex-grow leading-relaxed">
                  {card.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
