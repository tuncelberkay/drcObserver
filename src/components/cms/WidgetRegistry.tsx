"use client"

import dynamic from "next/dynamic"
import { MasterDetailTable } from "../infrastructure/MasterDetailTable"
import { CMSStatCard, CMSBarChart, CMSPieChart, CMSLineGraph } from "./ChartingEngines"



export const WidgetRegistry: Record<string, React.FC<{ config: any, widget: any, previewData?: any, rowSync?: any }>> = {
  MASTER_DETAIL_TABLE: ({ config, widget, previewData, rowSync }) => <MasterDetailTable widget={widget} config={config} previewData={previewData} />,
  STAT_CARD: ({ config, widget, previewData, rowSync }) => <CMSStatCard config={config} widget={widget} previewData={previewData} rowSync={rowSync} />,
  BAR_CHART: ({ config, widget, previewData, rowSync }) => <CMSBarChart config={config} widget={widget} previewData={previewData} rowSync={rowSync} />,
  PIE_CHART: ({ config, widget, previewData, rowSync }) => <CMSPieChart config={config} widget={widget} previewData={previewData} rowSync={rowSync} />,
  LINE_GRAPH: ({ config, widget, previewData, rowSync }) => <CMSLineGraph config={config} widget={widget} previewData={previewData} rowSync={rowSync} />
}
