import { NextResponse } from 'next/server'
import { applyDataReduction } from '@/utils/dataProcessor'
import { executeRawDbQuery } from '@/utils/dbConnectors'
import { getCyberArkCredentials } from '@/lib/cyberark'

export async function POST(request: Request) {
  try {
    const { type, endpointURI, credentialsJson, queryPayload } = await request.json()

    if (!endpointURI && type !== "POSTGRESQL" && type !== "MYSQL") {
      return NextResponse.json({ error: "Endpoint URI is required for this connection type." }, { status: 400 })
    }

    let headers: Record<string, string> = { "Content-Type": "application/json" }
    
    let parsedCreds: any = {}
    try {
      if (credentialsJson && credentialsJson.trim() !== "{}") {
        parsedCreds = JSON.parse(credentialsJson)
      }
    } catch (e) {
      console.warn("Invalid credentials payload provided during test")
    }

    if (parsedCreds.cyberArk && parsedCreds.cyberArk.appId) {
       try {
         const vaultResp = await getCyberArkCredentials(parsedCreds.cyberArk)
         if (type === "POSTGRESQL" || type === "MYSQL" || type === "MARIADB" || type === "ORACLE") {
           parsedCreds.password = vaultResp.Content
           if (vaultResp.UserName) parsedCreds.user = vaultResp.UserName
           if (vaultResp.Address) parsedCreds.host = vaultResp.Address
         } else {
           let credStr = JSON.stringify(parsedCreds)
           if (credStr.includes("{{VAULT_TOKEN}}")) {
             credStr = credStr.replace(/\{\{VAULT_TOKEN\}\}/g, vaultResp.Content)
             parsedCreds = JSON.parse(credStr)
           } else {
             parsedCreds.headers = { ...parsedCreds.headers, Authorization: `Bearer ${vaultResp.Content}` }
           }
         }
       } catch (err: any) {
         return NextResponse.json({ error: "Vault Simulation Interception Failed: " + err.message }, { status: 403 })
       }
    }

    if (parsedCreds.headers) headers = { ...headers, ...parsedCreds.headers }

    let finalData: any = null;

    // REST / PROMETHEUS Proxy
    if (type === "REST_API" || type === "PROMETHEUS" || type === "HTTP_JSON") {
      const targetUrl = queryPayload && queryPayload.trim() !== "" 
          ? `${endpointURI}${queryPayload}` 
          : endpointURI
          
      try {
        const response = await fetch(targetUrl, { method: 'GET', headers, cache: 'no-store' })
        if (!response.ok) {
           finalData = { error: `Server HTTP ${response.status}: ${response.statusText}` }
        } else {
           finalData = await response.json()
        }
      } catch(e: any) {
        finalData = { error: e.message }
      }
    } else if (type === "POSTGRESQL" || type === "MYSQL" || type === "MARIADB" || type === "ORACLE") {
      try {
        const host = parsedCreds.host || (endpointURI ? endpointURI.split(':')[0] : "localhost")
        const port = Number(parsedCreds.port) || (type === "POSTGRESQL" ? 5432 : (type === "ORACLE" ? 1521 : 3306))
        const database = parsedCreds.database || ""
        const user = parsedCreds.user || ""
        const password = parsedCreds.password || ""
        
        const qp = queryPayload?.trim() || "SELECT 1 as connected;"
        finalData = await executeRawDbQuery(type, host, port, user, password, database, qp)
      } catch (err: any) {
        finalData = { error: err.message, details: "Database Connection Failed." }
      }
    } else {
      finalData = { error: `Architecture '${type}' not supported natively yet. Only POSTGRESQL, MYSQL, REST_API, and PROMETHEUS are active.` }
    }

    return NextResponse.json({ 
      data: finalData
    })

  } catch (error) {
    console.error("[CMS Proxy Setup] Connection Test Gateway Error:", error)
    return NextResponse.json({ error: "Internal Context Simulation Error" }, { status: 500 })
  }
}
