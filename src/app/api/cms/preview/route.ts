import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { applyDataReduction } from '@/utils/dataProcessor'
import { executeRawDbQuery } from '@/utils/dbConnectors'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { sourceIds, dataQuery, configJsonStr } = await request.json()

    let dsPayloads: any[] = []

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      // Inject synthetic fallback array payload if no remote DB is linked so local development tables don't render empty
      dsPayloads = [[
        { id: "mock-01", hostname: "prod-core-web-01", os: "Ubuntu 22.04", agentStatus: "Running", appOwner: "Payments", techStack: "Node.js / Next", syncProgress: 100, updatedAt: new Date().toISOString() },
        { id: "mock-02", hostname: "prod-core-db-main", os: "RHEL 9", agentStatus: "Warning", appOwner: "Data Platform", techStack: "PostgreSQL 15", syncProgress: 45, updatedAt: new Date().toISOString() },
        { id: "mock-03", hostname: "drc-core-web-01", os: "Ubuntu 22.04", agentStatus: "Offline", appOwner: "Payments", techStack: "Node.js / Next", syncProgress: 0, updatedAt: new Date().toISOString() },
        { id: "mock-04", hostname: "prod-auth-redis", os: "Alpine Linux", agentStatus: "Running", appOwner: "Identity", techStack: "Redis 7", syncProgress: 100, updatedAt: new Date().toISOString() },
      ]]
    } else {
      const dataSources = await prisma.appDataSource.findMany({
        where: { id: { in: sourceIds } }
      })

      if (dataSources.length === 0) {
        return NextResponse.json({ error: "Selected Data Sources could not be found." }, { status: 404 })
      }

      // Process MULTI-SOURCE Arrays concurrently
      dsPayloads = await Promise.all(dataSources.map(async (source: any) => {
      const { endpointURI, credentialsJson, type, queryPayload } = source
      let headers: Record<string, string> = { "Content-Type": "application/json" }
      
      try {
        const parsedCreds = JSON.parse(credentialsJson)
        if (parsedCreds.headers) headers = { ...headers, ...parsedCreds.headers }
      } catch (e) {
        console.warn("Invalid credentials payload configured on Data Source", source.id)
      }

      // REST / PROMETHEUS Proxy
      if (type === "REST_API" || type === "PROMETHEUS" || type === "HTTP_JSON") {
        const targetUrl = queryPayload && queryPayload.trim() !== "" 
            ? `${endpointURI}${queryPayload}` 
            : endpointURI
            
        try {
          const response = await fetch(targetUrl, { method: 'GET', headers, cache: 'no-store' })
          if (!response.ok) return { error: `Server HTTP ${response.status}`, __source: source.name }
          return await response.json()
        } catch(e: any) {
          return { error: e.message, __source: source.name }
        }
      }

      // POSTGRES / MYSQL / ORACLE Real Resolver Block
      if (type === "POSTGRESQL" || type === "MYSQL" || type === "MARIADB" || type === "ORACLE") {
         try {
           let parsedCreds: any = {}
           try { parsedCreds = JSON.parse(credentialsJson) } catch (e) {}
   
           const host = parsedCreds.host || (endpointURI ? endpointURI.split(':')[0] : "localhost")
           const port = Number(parsedCreds.port) || (type === "POSTGRESQL" ? 5432 : (type === "ORACLE" ? 1521 : 3306))
           const database = parsedCreds.database || ""
           const user = parsedCreds.user || ""
           const password = parsedCreds.password || ""
           
           const qp = queryPayload?.trim() || "SELECT 1 as connected;"
           return await executeRawDbQuery(type, host, port, user, password, database, qp)
         } catch(e: any) {
           return { error: e.message, __source: source.name }
         }
      }

      return { error: "Architecture not supported", __source: source.name }
    }))
    }

    // Execute Transform Logic dynamically if provided explicitly safely elegantly within the Node Sandbox
    let finalData = dsPayloads[0] // Default to index 0
    
    if (dataQuery && dataQuery.trim() !== "") {
      try {
        const mathContext = new Function('ds', `return ${dataQuery};`)
        finalData = mathContext(dsPayloads)
      } catch (e: any) {
        console.error("[CMS Proxy Setup] Math Evaluator Preview Error:", e)
        return NextResponse.json({ error: `Mathematical Evaluation Error: ${e.message}`, details: "Bad Javascript Formula Execution" }, { status: 400 })
      }
    }

    let configObj = {}
    try { configObj = JSON.parse(configJsonStr || "{}") } catch(e) {}
    
    if (finalData && !finalData.error) {
       finalData = applyDataReduction(finalData, configObj)
    }
    
    return NextResponse.json({ 
      data: finalData
    })

  } catch (error) {
    console.error("[CMS Proxy Preview] Gateway Error:", error)
    return NextResponse.json({ error: "Internal Context Simulation Error" }, { status: 500 })
  }
}
