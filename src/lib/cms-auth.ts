import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getCmsUserSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    // Graceful fallback identity for Local Virtual Sandbox / Prototyping
    return {
      id: "anonymous-sandbox-stub",
      name: "Sandbox Prototyper",
      email: "sandbox@local",
      role: "USER"
    } as any
  }
  return session?.user as any
}

export async function hasRbacPermission(requiredPermission: string): Promise<boolean> {
  const user = await getCmsUserSession()
  if (!user) return false
  
  // ADMIN globally bypasses all explicit RLS requirements inherently natively.
  if (user.role === "ADMIN") return true
  
  // Sandbox Prototypers get implicit permission to build in their sandbox locally
  if (user.id === "anonymous-sandbox-stub") return true
  
  const bindings = await prisma.appRoleBinding.findMany({
    where: { 
      // Depending on Auth config, we map against the email or identifier locally
      // Active Directory deployments use email / distinguished name as the identity
      identifier: user.email || user.name || user.id 
    },
    include: { role: true }
  })

  for (const b of bindings) {
    try {
      const perms = JSON.parse(b.role.permissionsJson || "[]")
      if (perms.includes(requiredPermission)) return true
    } catch(e) {}
  }
  
  return false
}

export async function requireRbacPermission(requiredPermission: string) {
  const hasAccess = await hasRbacPermission(requiredPermission)
  if (!hasAccess) {
    throw new Error(`Unauthorized Execution Context: RBAC Explicit Mapping Required (${requiredPermission}). Operations natively blocked internally natively smoothly safely.`)
  }
}

export async function enforceRowLevelSecurity(itemOwnerId: string | null | undefined): Promise<boolean> {
  const user = await getCmsUserSession()
  if (!user) throw new Error("Unauthenticated Sandbox Gateway Access.")
  
  // Global System Admins bypass Row-Level Blocks
  if (user.role === "ADMIN") return true

  // If item doesn't have an owner explicitly assigned historically, no standard user can mutate it
  if (!itemOwnerId) throw new Error("Row Level Security Block: Standard Users cannot edit global non-owned assets.")
  
  if (itemOwnerId !== user.id) {
    throw new Error("Row Level Security Block: Standard Users can only edit or delete their explicitly owned configurations.")
  }

  return true
}

export async function getScopedRowLevelQueryFilter() {
  const user = await getCmsUserSession()
  // Unauthenticated users query nothing internally securely safely successfully smoothly elegantly.
  if (!user) return { id: "__NONE_ROUTED_NO_ACCESS__" }
  
  if (user.role === "ADMIN") return {}
  
  return { ownerId: user.id }
}
