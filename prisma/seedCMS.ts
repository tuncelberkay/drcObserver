import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding CMS Engine Models...")

  // Clean existing rows
  await prisma.appNavigation.deleteMany()
  await prisma.appWidget.deleteMany()
  await prisma.appPage.deleteMany()

  // 1. DASHBOARD PAGE
  const dashboard = await prisma.appPage.create({
    data: {
      slug: 'dashboard',
      title: '{"en": "Summary Dashboard", "tr": "Özet Paneli"}',
      layoutType: 'GRID'
    }
  })

  // 1a. Dashboard Widgets
  await prisma.appWidget.createMany({
    data: [
      {
        pageId: dashboard.id,
        componentKey: 'OBSERVABILITY_GRID',
        configJson: '{"title": {"en": "Global Sync Metrics", "tr": "Küresel Senkron Metrikleri"}}',
        x: 0, y: 0, w: 12, h: 4
      }
    ]
  })

  // 2. INFRASTRUCTURE PAGE
  const infrastructure = await prisma.appPage.create({
    data: {
      slug: 'infrastructure',
      title: '{"en": "Infrastructure Details", "tr": "Altyapı Detayları"}',
      layoutType: 'LIST'
    }
  })

  // 2a. Infrastructure Widgets
  await prisma.appWidget.createMany({
    data: [
      {
        pageId: infrastructure.id,
        componentKey: 'MASTER_DETAIL_TABLE',
        configJson: '{"endpoint": "/api/metrics"}',
        x: 0, y: 0, w: 12, h: 6
      }
    ]
  })

  // 3. NAVIGATION MAPPINGS
  // Let's create navigation
  await prisma.appNavigation.create({
    data: {
      label: '{"en": "Home", "tr": "Ana Sayfa"}',
      iconName: 'Home',
      path: '/',
      sortOrder: 1
    }
  })

  await prisma.appNavigation.create({
    data: {
      pageId: dashboard.id,
      label: '{"en": "Dashboard", "tr": "Panel"}',
      iconName: 'LayoutDashboard',
      path: '/p/dashboard',
      sortOrder: 2
    }
  })

  await prisma.appNavigation.create({
    data: {
      pageId: infrastructure.id,
      label: '{"en": "Infrastructure", "tr": "Altyapı"}',
      iconName: 'Server',
      path: '/p/infrastructure',
      sortOrder: 3
    }
  })

  console.log("CMS seeding finished.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
