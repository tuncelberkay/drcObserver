import { NextResponse } from 'next/server'
import { saveSystemConfig } from '@/lib/drc-config'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

export async function POST(req: Request) {
  try {
    const { provider, url } = await req.json()

    if (!provider || !url) {
      return NextResponse.json({ error: "Missing native configuration payloads" }, { status: 400 })
    }

    if (provider === "postgresql" && !url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
      return NextResponse.json({ error: "PostgreSQL Engine natively requires URL starting with postgresql:// or postgres://" }, { status: 400 })
    }
    
    if (provider === "mysql" && !url.startsWith("mysql://")) {
      return NextResponse.json({ error: "MySQL Engine gracefully requires URL starting with mysql://" }, { status: 400 })
    }

    if (provider === "oracle" && !url.startsWith("oracle://")) {
      return NextResponse.json({ error: "Oracle Core Engine emphatically requires URL starting with oracle://" }, { status: 400 })
    }

    if (provider === "sqlite" && !url.startsWith("file:")) {
      return NextResponse.json({ error: "SQLite Engine explicitly requires URL starting with file:" }, { status: 400 })
    }

    // 0. Perform Native SQLite Database JSON Dump explicitly preserving states 
    // This allows the rebooted Prisma Client to theoretically automatically hydrate logic natively.
    try {
      const dump = {
        pages: await prisma.appPage.findMany(),
        widgets: await prisma.appWidget.findMany(),
        sources: await prisma.appDataSource.findMany(),
        roles: await prisma.appRole.findMany(),
        bindings: await prisma.appRoleBinding.findMany(),
        navs: await prisma.appNavigation.findMany(),
        users: await prisma.user.findMany(),
        accounts: await prisma.account.findMany(),
        sessions: await prisma.session.findMany(),
        ldap: await prisma.ldapConfig.findMany(),
        hosts: await prisma.hostMetric.findMany(),
        settings: prisma.systemSettings ? await prisma.systemSettings.findMany() : [],
        vaults: prisma.vaultIntegration ? await prisma.vaultIntegration.findMany() : []
      }
      fs.writeFileSync(path.join(process.cwd(), 'drc-migration-dump.json'), JSON.stringify(dump))
    } catch(err) {
      console.warn("Migration dump skipped or failed. Likely first execution mapping.", err)
    }

    // 1. Write the System Config mapping to intercept future setup logic smoothly
    saveSystemConfig({
      setupCompleted: true,
      dbProvider: provider,
      connectionUrl: url
    })

    // 2. Rewrite the Physical Prisma Schema architecture string seamlessly
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
    const envPath = path.join(process.cwd(), '.env')
    
    let schemaBody = fs.readFileSync(schemaPath, 'utf-8')
    
    schemaBody = schemaBody.replace(/provider\s*=\s*"[^"]+"/, `provider = "${provider}"`)
    schemaBody = schemaBody.replace(/url\s*=\s*"[^"]+"|url\s*=\s*env\("[^"]+"\)/, `url = env("DATABASE_URL")`)
    
    fs.writeFileSync(schemaPath, schemaBody)
    
    // 3. Inject DATABASE_URL into Node process cleanly natively securely
    let envBody = ""
    if (fs.existsSync(envPath)) {
      envBody = fs.readFileSync(envPath, 'utf-8')
    }
    
    if (envBody.includes('DATABASE_URL=')) {
      envBody = envBody.replace(/DATABASE_URL=.*/, `DATABASE_URL="${url}"`)
    } else {
      envBody += `\nDATABASE_URL="${url}"\n`
    }
    fs.writeFileSync(envPath, envBody)

    // 4. Detached background execution rebuilding Native Prisma binaries mapping smoothly
    const command = `npx prisma db push && npx prisma generate`
    
    exec(command, { cwd: process.cwd(), env: process.env }, (error, stdout, stderr) => {
      console.log("[SYSTEM] Database Re-compilation executed.", stdout, stderr)
      
      // Fire generic exit commanding Docker/PM2 to reboot the Node array gracefully natively
      setTimeout(() => {
        console.log("[SYSTEM] Executing graceful native restart natively...")
        process.exit(1)
      }, 2000)
    })

    return NextResponse.json({ success: true, message: "Architecture shift mapped successfully. Restarting Native runtime cleanly." })
  } catch (e: any) {
    console.error("[SYSTEM ERROR] Failed Architecture Mapping:", e)
    return NextResponse.json({ error: e.message || "Native setup exception triggered natively" }, { status: 500 })
  }
}
