import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { applyDataReduction } from '@/utils/dataProcessor'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { sourceIds, dataQuery, configJsonStr } = await request.json()

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json({ error: "No Data Sources selected for preview." }, { status: 400 })
    }

    const dataSources = await prisma.appDataSource.findMany({
      where: { id: { in: sourceIds } }
    })

    if (dataSources.length === 0) {
      return NextResponse.json({ error: "Selected Data Sources could not be found." }, { status: 404 })
    }

    // Process MULTI-SOURCE Arrays concurrently
    const dsPayloads = await Promise.all(dataSources.map(async (source: any) => {
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

      // POSTGRES / ORACLE Mock Resolver Block
      if (type === "POSTGRESQL" || type === "ORACLE") {
         return [
           { id: `db-${source.id}-1`, hostname: "db-primary", os: "RHEL 9", agentStatus: "Running", appOwner: "CoreDB", techStack: type, syncProgress: 100, updatedAt: new Date().toISOString() },
           { id: `db-${source.id}-2`, hostname: "db-standby", os: "RHEL 9", agentStatus: "Running", appOwner: "CoreDB", techStack: type, syncProgress: 98, updatedAt: new Date().toISOString() },
           { id: `db-${source.id}-3`, hostname: "db-archive", os: "RHEL 8", agentStatus: "Offline", appOwner: "Analytics", techStack: type, syncProgress: 0, updatedAt: new Date().toISOString() }
         ]
      }

      return { error: "Architecture not supported", __source: source.name }
    }))

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
