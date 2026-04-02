import { NextResponse } from 'next/server'
import { saveSystemConfig } from '@/lib/drc-config'

export async function POST(req: Request) {
  try {
    const { cyberarkApiUrl } = await req.json()

    // 1. Write the System Config mapping securely smoothly
    saveSystemConfig({
      cyberarkApiUrl: cyberarkApiUrl || ""
    })

    return NextResponse.json({ success: true, message: "Vault Architecture Target mapped successfully natively." })
  } catch (e: any) {
    console.error("[VAULT SYSTEM ERROR] Failed Vault Mapping:", e)
    return NextResponse.json({ error: e.message || "Native setup exception triggered natively" }, { status: 500 })
  }
}
