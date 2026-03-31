"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function createAppPage(formData: FormData) {
  const slug = formData.get("slug") as string
  const titleEn = formData.get("titleEn") as string
  const titleTr = formData.get("titleTr") as string
  const addToNav = formData.get("addToNav") === "on"

  if (!slug || !titleEn || !titleTr) {
    throw new Error("Missing required fields")
  }

  const titleJson = JSON.stringify({ en: titleEn, tr: titleTr })

  const page = await prisma.appPage.create({
    data: {
      slug,
      title: titleJson,
      layoutType: "GRID",
    }
  })

  if (addToNav) {
    await prisma.appNavigation.create({
      data: {
        pageId: page.id,
        label: titleJson,
        iconName: "Layout",
        path: `/p/${slug}`,
        sortOrder: 10
      }
    })
  }

  revalidatePath("/[locale]/admin", "page")
  revalidatePath("/[locale]/layout", "layout")
  
  return { success: true, pageId: page.id }
}

export async function deleteAppPage(pageId: string) {
  await prisma.appPage.delete({
    where: { id: pageId }
  })
  
  revalidatePath("/[locale]/admin", "page")
  revalidatePath("/[locale]/layout", "layout")
  
  return { success: true }
}

export async function addWidgetToPage(pageId: string, componentKey: string, x: number = 0, y: number = 0, w: number = 6, h: number = 4) {
  const wRecord = await prisma.appWidget.create({
    data: {
      pageId,
      componentKey,
      configJson: "{}",
      x,
      y,
      w,
      h
    }
  })
  
  revalidatePath(`/[locale]/admin/editor/[id]`, "page")
  
  return { success: true, widgetId: wRecord.id }
}

export async function removeWidget(widgetId: string) {
  await prisma.appWidget.delete({
    where: { id: widgetId }
  })
  
  revalidatePath(`/[locale]/admin/editor/[id]`, "page")
  return { success: true }
}

export async function createAppDataSource(name: string, type: string, endpointURI: string, credentialsJson: string, queryPayload: string, refreshInterval: number) {
  await prisma.appDataSource.create({
    data: {
      name,
      type,
      endpointURI,
      credentialsJson,
      queryPayload,
      refreshInterval
    }
  })
  revalidatePath("/[locale]/admin/sources", "page")
  return { success: true }
}
export async function updateAppDataSource(
  id: string,
  name: string, 
  type: string, 
  endpointURI: string, 
  credentialsJson: string,
  queryPayload: string,
  refreshInterval: number
) {
  const result = await prisma.appDataSource.update({
    where: { id },
    data: { name, type, endpointURI, credentialsJson, queryPayload, refreshInterval }
  })
  revalidatePath("/[locale]/admin/sources", "page")
  return result
}
export async function deleteAppDataSource(id: string) {
  await prisma.appDataSource.delete({ where: { id } })
  revalidatePath("/[locale]/admin/sources", "page")
  return { success: true }
}

export async function bindWidgetDataSource(widgetId: string, dataSourceIds: string[], dataQuery: string, configJson: string, x?: number, y?: number, w?: number, h?: number) {
  
  const updateData: any = {
      dataQuery,
      configJson,
      dataSources: {
        set: dataSourceIds.map(id => ({ id }))
      }
  }

  if (x !== undefined) updateData.x = x;
  if (y !== undefined) updateData.y = y;
  if (w !== undefined) updateData.w = w;
  if (h !== undefined) updateData.h = h;

  await prisma.appWidget.update({
    where: { id: widgetId },
    data: updateData
  })
  revalidatePath("/[locale]/admin/editor/[id]", "page")
  return { success: true }
}

export async function updateWidgetGridPosition(layouts: Array<{id: string, x: number, y: number, w: number, h: number}>) {
  await Promise.all(
    layouts.map(layout => 
      prisma.appWidget.update({
        where: { id: layout.id },
        data: { x: layout.x, y: layout.y, w: layout.w, h: layout.h }
      })
    )
  )
  revalidatePath("/[locale]/p/[slug]", "page")
  return { success: true }
}

export async function updateNavigationOrder(updates: Array<{ id: string, sortOrder: number }>) {
  await Promise.all(
    updates.map(update => 
      prisma.appNavigation.update({
        where: { id: update.id },
        data: { sortOrder: update.sortOrder }
      })
    )
  )
  revalidatePath("/[locale]/admin/pages", "page")
  revalidatePath("/[locale]/layout", "layout")
  revalidatePath("/[locale]", "page")
  return { success: true }
}

export async function togglePageLock(pageId: string, isLocked: boolean) {
  await prisma.appPage.update({
    where: { id: pageId },
    data: { isLocked }
  })
  
  revalidatePath("/[locale]/admin/editor/[id]", "page")
  revalidatePath("/[locale]/p/[slug]", "page")
  return { success: true }
}
