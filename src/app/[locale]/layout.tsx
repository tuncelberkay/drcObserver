import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { LiveSyncFooter } from "@/components/layout/LiveSyncFooter";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { prisma } from '@/lib/prisma';
import "../globals.css";


export const metadata: Metadata = {
  title: "Production-to-DRC Observability",
  description: "High-performance NOC observability tool",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  // Fetch navigation payload asynchronously without blocking first byte rendering excessively via Promise parallel resolving
  const navItemsRaw = await prisma.appNavigation.findMany({
    orderBy: { sortOrder: 'asc' }
  });

  const navItems = navItemsRaw.map(n => ({
    id: n.id,
    label: n.label,
    path: n.path,
    iconName: n.iconName,
    sortOrder: n.sortOrder
  }));

  return (
    <html
      lang={locale}
      className={`h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <TopNavBar navItems={navItems} />
            <div className="flex-1 pb-10">
              {children}
            </div>
            <LiveSyncFooter />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
