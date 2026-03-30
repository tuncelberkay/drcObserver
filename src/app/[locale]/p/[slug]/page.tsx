import { notFound } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer"
import { getTranslations } from "next-intl/server"

const prisma = new PrismaClient()

export default async function CMSPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params

  // Fetch the page exactly mimicking the slug 
  const pageData = await prisma.appPage.findUnique({
    where: { slug },
    include: {
      widgets: {
        orderBy: { y: 'asc' } // basic grid ordering
      }
    }
  })

  // Next.js 404 handler if the slug isn't found in DB
  if (!pageData) {
    notFound()
  }

  // Inject straight into the CMS client resolver 
  return <DynamicPageRenderer pageData={pageData} />
}
