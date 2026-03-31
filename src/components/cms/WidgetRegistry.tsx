"use client"

import dynamic from "next/dynamic"
import { MasterDetailTable } from "../infrastructure/MasterDetailTable"
import { CMSStatCard, CMSBarChart, CMSPieChart, CMSLineGraph } from "./ChartingEngines"

// Dynamic import to prevent hydration issues with react-grid-layout
const DynamicDraggableGrid = dynamic(
  () => import("@/components/dashboard/DraggableGrid").then(mod => mod.DraggableGrid),
  { ssr: false, loading: () => <p className="p-8 text-center text-slate-400">Loading Grid Payload...</p> }
)

export const WidgetRegistry: Record<string, React.FC<{ config: any, widget: any, previewData?: any }>> = {
  MASTER_DETAIL_TABLE: ({ config, widget, previewData }) => <MasterDetailTable widget={widget} config={config} previewData={previewData} />,
  STAT_CARD: ({ config, widget, previewData }) => <CMSStatCard config={config} widget={widget} previewData={previewData} />,
  BAR_CHART: ({ config, widget, previewData }) => <CMSBarChart config={config} widget={widget} previewData={previewData} />,
  PIE_CHART: ({ config, widget, previewData }) => <CMSPieChart config={config} widget={widget} previewData={previewData} />,
  LINE_GRAPH: ({ config, widget, previewData }) => <CMSLineGraph config={config} widget={widget} previewData={previewData} />,
  OBSERVABILITY_GRID: ({ config, widget }) => {
    const Component = DynamicDraggableGrid as any
    return <Component widget={widget} config={config} />
  }
}
