"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

export async function saveLdapConfig(data: {
  serverUrl: string
  baseDn: string
  bindDn: string
  bindPassword?: string
  userFilter: string
  isActive: boolean
}) {
  const existing = await prisma.ldapConfig.findUnique({ where: { id: "singleton" } })
  
  if (existing) {
    await prisma.ldapConfig.update({
      where: { id: "singleton" },
      data: {
        serverUrl: data.serverUrl,
        baseDn: data.baseDn,
        bindDn: data.bindDn,
        // Only update password if a new one is actively submitted
        ...(data.bindPassword ? { bindPassword: data.bindPassword } : {}),
        userFilter: data.userFilter,
        isActive: data.isActive
      }
    })
  } else {
    await prisma.ldapConfig.create({
      data: {
        id: "singleton",
        serverUrl: data.serverUrl,
        baseDn: data.baseDn,
        bindDn: data.bindDn,
        bindPassword: data.bindPassword || "",
        userFilter: data.userFilter,
        isActive: data.isActive
      }
    })
  }

  revalidatePath('/[locale]/admin/ldap', 'page')
  return { success: true }
}
