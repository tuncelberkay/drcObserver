import { prisma } from '@/lib/prisma'
import { decryptString } from '@/lib/encryption'

export interface CyberArkConfig {
  vaultId: string
  safe: string
  objectName: string
}

export interface CyberArkResponse {
  Content: string // The actual password
  UserName?: string
  Address?: string
  Properties?: Record<string, string>
}

/**
 * Enterprise CyberArk Central Credential Provider (CCP) Fetcher
 * Securely grabs passwords at runtime utilizing zero-trust architectures.
 */
export async function getCyberArkCredentials(config: CyberArkConfig): Promise<CyberArkResponse> {
  const settings = prisma.vaultIntegration ? await prisma.vaultIntegration.findUnique({ where: { id: config.vaultId } }).catch(()=>null) : null
  const baseUrl = settings?.cyberarkApiUrl || process.env.CYBERARK_API_URL

  // 1. Mock Development Fallback Logic
  if (!baseUrl || baseUrl === "mock") {
    console.log(`[CYBERARK MOCK] Intercepting CCP call for Safe: ${config.safe}, Object: ${config.objectName}`)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          Content: "v@ult_s3cr3t_m0ck",
          UserName: "vault_admin",
          Address: "10.0.0.99"
        })
      }, 300) // Simulate REST latency securely natively
    })
  }

  // 2. Production Native REST Gateway execution natively
  try {
    const targetUrl = `${baseUrl}/AIMWebService/api/Accounts?AppID=${encodeURIComponent(settings?.vaultAppId || "App_Mock")}&Safe=${encodeURIComponent(config.safe)}&Object=${encodeURIComponent(config.objectName)}`
    
    // CCP typically uses Client Certificates mapped globally on the host infrastructure natively. 
    // In advanced setups natively, additional headers could be mapped here natively.
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (settings?.vaultUsername && settings?.vaultPassword) {
      const livePass = decryptString(settings.vaultPassword)
      const b64 = Buffer.from(`${settings.vaultUsername}:${livePass}`).toString('base64')
      headers['Authorization'] = `Basic ${b64}`
    }

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store' // Never statically cache passwords explicitly globally
    })

    if (!res.ok) {
      throw new Error(`CyberArk CCP returned HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    return data as CyberArkResponse
  } catch(error: any) {
    console.error("[CYBERARK ERROR] Target Safe/Object execution failed strictly:", error.message)
    throw new Error(`Vault Credential Fetch Error: ${error.message}`)
  }
}
