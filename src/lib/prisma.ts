import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// HOTFIX: Auto-migrate critical schema drifts in persistent SQLite volumes on startup
setTimeout(async () => {
  try {
    // 1. Add missing isLocked to AppPage
    await prisma.$executeRawUnsafe(`ALTER TABLE "AppPage" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT 0;`).catch(() => {});
    // 2. Add missing dataQuery to AppWidget
    await prisma.$executeRawUnsafe(`ALTER TABLE "AppWidget" ADD COLUMN "dataQuery" TEXT;`).catch(() => {});
    // 3. Add DataSource System
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AppDataSource" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "endpointURI" TEXT NOT NULL,
        "credentialsJson" TEXT NOT NULL,
        "queryPayload" TEXT NOT NULL DEFAULT '',
        "refreshInterval" INTEGER NOT NULL DEFAULT 10,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AppDataSource_name_key" ON "AppDataSource"("name");`).catch(() => {});
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_AppDataSourceToAppWidget" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_AppDataSourceToAppWidget_A_fkey" FOREIGN KEY ("A") REFERENCES "AppDataSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "_AppDataSourceToAppWidget_B_fkey" FOREIGN KEY ("B") REFERENCES "AppWidget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "_AppDataSourceToAppWidget_AB_unique" ON "_AppDataSourceToAppWidget"("A", "B");`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "_AppDataSourceToAppWidget_B_index" ON "_AppDataSourceToAppWidget"("B");`).catch(() => {});
    
    // 4. Role Based Access
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AppRole" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "permissionsJson" TEXT NOT NULL DEFAULT '[]',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AppRoleBinding" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "bindType" TEXT NOT NULL,
        "identifier" TEXT NOT NULL,
        "roleId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AppRoleBinding_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AppRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `).catch(() => {});
    
    // 5. User Roles Support
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "password" TEXT;`).catch(() => {});
    
  } catch (e) {
    console.error("Auto-sync drift handler bypassed internal warnings: ", e);
  }
}, 100);
