import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { executeRawDbQuery } from '@/utils/dbConnectors'
import { getCyberArkCredentials } from '@/lib/cyberark'
import { decryptString } from '@/lib/encryption'

export async function POST(request: Request) {
  try {
    const { dataSourceId, type, method, endpoint, payload } = await request.json()

    if (!dataSourceId) {
       return NextResponse.json({ error: "Missing Target DataSource ID for secure execution context." }, { status: 400 })
    }

    const ds = await prisma.appDataSource.findUnique({
      where: { id: dataSourceId }
    })

    if (!ds) {
       return NextResponse.json({ error: "Action Controller DataSource not found or deleted." }, { status: 404 })
    }

    let parsedCreds: any = {}
    try { if (ds.credentialsJson) parsedCreds = JSON.parse(decryptString(ds.credentialsJson)) } catch (e) {}

    // Security Phase: Transparently grab Vault Credentials globally effortlessly natively
    if (parsedCreds.cyberArk && parsedCreds.cyberArk.appId) {
       try {
         const vaultResp = await getCyberArkCredentials(parsedCreds.cyberArk)
         // Automatically map vault responses strictly natively smoothly
         if (type === "DB") {
           parsedCreds.password = vaultResp.Content
           if (vaultResp.UserName) parsedCreds.user = vaultResp.UserName
           if (vaultResp.Address) parsedCreds.host = vaultResp.Address
         } else if (type === "API") {
           let credStr = JSON.stringify(parsedCreds)
           if (credStr.includes("{{VAULT_TOKEN}}")) {
             credStr = credStr.replace(/\{\{VAULT_TOKEN\}\}/g, vaultResp.Content)
             parsedCreds = JSON.parse(credStr)
           } else {
             // Provide basic Authorization header dynamically securely via CyberArk
             parsedCreds.headers = { ...parsedCreds.headers, Authorization: `Bearer ${vaultResp.Content}` }
           }
         }
       } catch (err: any) {
         return NextResponse.json({ error: "Vault Interception Failed: " + err.message }, { status: 403 })
       }
    }

    // Handle Native DB Executions
    if (type === "DB") {
       const host = parsedCreds.host || (ds.endpointURI ? ds.endpointURI.split(':')[0] : "localhost")
       const port = Number(parsedCreds.port) || (ds.type === "POSTGRESQL" ? 5432 : (ds.type === "ORACLE" ? 1521 : 3306))
       const database = parsedCreds.database || ""
       const user = parsedCreds.user || ""
       const password = parsedCreds.password || ""
       
       if (!payload || payload.trim() === "") {
          return NextResponse.json({ error: "No executable DB query provided." }, { status: 400 })
       }

       try {
         const result = await executeRawDbQuery(ds.type, host, port, user, password, database, payload)
         return NextResponse.json({ success: true, data: result })
       } catch(e: any) {
         return NextResponse.json({ error: e.message }, { status: 500 })
       }
    } 
    
    // Handle Client REST Proxies
    if (type === "API") {
      let headers: Record<string, string> = { "Content-Type": "application/json" }
      
      if (parsedCreds.headers) {
         headers = { ...headers, ...parsedCreds.headers }
      }

      // Merge Base URI and endpoint Suffix securely
      const baseUri = ds.endpointURI ? ds.endpointURI.replace(/\/$/, '') : ""
      const cleanEndpoint = endpoint ? (endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : ""
      const targetUrl = `${baseUri}${cleanEndpoint}`

      const fetchOptions: RequestInit = {
         method: method || "GET",
         headers,
         cache: 'no-store'
      }

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || "") && payload) {
         fetchOptions.body = payload
      }

      try {
         const response = await fetch(targetUrl, fetchOptions)
         const text = await response.text()
         let data = null
         try { data = JSON.parse(text) } catch(e) { data = text }
         
         if (!response.ok) {
            return NextResponse.json({ error: `Backend API Gateway failed (${response.status})`, data }, { status: response.status })
         }
         return NextResponse.json({ success: true, data })
      } catch(e: any) {
         return NextResponse.json({ error: `Fetch failed executing at Gateway: ${e.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Unsupported Action Architecture Format." }, { status: 400 })

  } catch (err: any) {
    console.error("[CMS Execution Proxy] Error:", err.message)
    return NextResponse.json({ error: "Internal Gateway Error" }, { status: 500 })
  }
}
