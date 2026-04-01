"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

// CREATE ROLE
export async function createAppRole(name: string, description: string, permissionsJson: string) {
  const role = await prisma.appRole.create({
    data: { name, description, permissionsJson }
  })
  revalidatePath('/[locale]/admin/roles', 'page')
  return role
}

// DELETE ROLE
export async function deleteAppRole(id: string) {
  await prisma.appRole.delete({ where: { id } })
  revalidatePath('/[locale]/admin/roles', 'page')
  return { success: true }
}

// UPDATE ROLE PERMISSIONS
export async function updateAppRolePermissions(id: string, permissionsJson: string) {
  const role = await prisma.appRole.update({
    where: { id },
    data: { permissionsJson }
  })
  revalidatePath('/[locale]/admin/roles', 'page')
  return role
}

// CREATE ROLE BINDING
export async function createAppRoleBinding(roleId: string, bindType: "GROUP" | "USER", identifier: string) {
  const binding = await prisma.appRoleBinding.create({
    data: { roleId, bindType, identifier }
  })
  revalidatePath('/[locale]/admin/roles', 'page')
  return binding
}

// DELETE ROLE BINDING
export async function deleteAppRoleBinding(id: string) {
  await prisma.appRoleBinding.delete({ where: { id } })
  revalidatePath('/[locale]/admin/roles', 'page')
  return { success: true }
}
