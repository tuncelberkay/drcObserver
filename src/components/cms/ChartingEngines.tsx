"use client"

import React, { useEffect, useState } from "react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, LabelList,
  PieChart, Pie,
  LineChart, Line, AreaChart, Area
} from "recharts"
import { Loader2, AlertCircle } from "lucide-react"

// A generic hook to pull data from our Data Source Sandbox
function useWidgetData(widget: any, previewData?: any[]) {
  const [data, setData] = useState<any[]>(previewData || [])
  const [loading, setLoading] = useState(!previewData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If we're supplied with live preview memory state, bypass the entire DB fetching route cleanly natively!
    if (previewData) {
      setData(previewData)
      setLoading(false)
      setError(null)
      return
    }

    if (!widget?.id) {
      setLoading(false)
      setError("No widget context provided.")
      return
    }

    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/cms/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ widgetId: widget.id })
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to parse math payload")
        
        // Safely arrayify data
        const resolvedData = Array.isArray(json.data) ? json.data : [json.data]
        setData(resolvedData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTelemetry()
    
    const intervalTime = (widget.dataSources && widget.dataSources[0]?.refreshInterval) 
      ? widget.dataSources[0].refreshInterval * 1000 
      : 15000
      
    const handle = setInterval(fetchTelemetry, intervalTime)
    return () => clearInterval(handle)
  }, [widget?.id])

  return { data, loading, error }
}

const CustomThemeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-xl text-slate-800 dark:text-slate-200 text-sm z-50">
        {label && <p className="font-bold border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-medium text-slate-500 dark:text-slate-400">{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CMSStatCard({ widget, config, previewData }: { widget: any, config: any, previewData?: any[] }) {
  const { data, loading, error } = useWidgetData(widget, previewData)
  
  if (loading) return <div className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  if (error) return <div className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col gap-2 items-center justify-center text-red-500"><AlertCircle /> {error}</div>

  const primaryValue = data[0] ? (Object.values(data[0])[0] as string | number) : "N/A"
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-center items-center h-48 transition-colors">
      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{config.title || widget?.componentKey}</h4>
      <span className="text-5xl font-black text-indigo-500 dark:text-indigo-400 drop-shadow-sm">{primaryValue}</span>
    </div>
  )
}

export function CMSBarChart({ widget, config, previewData }: { widget: any, config: any, previewData?: any[] }) {
  const { data, loading, error } = useWidgetData(widget, previewData)
  
  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  if (error) return <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col gap-2 items-center justify-center text-red-500"><AlertCircle /> {error}</div>

  // Guess the keys dynamically if not provided by config
  const keys = data.length > 0 ? Object.keys(data[0]) : []
  const xKey = config.xAxisKey || keys[0] || "name"
  const barKey = config.dataKey || keys[1] || "value"
  const metricName = config.metricLabel || "Value"

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl h-64 flex flex-col transition-colors">
       <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">{config.title || "Bar Metrics"}</h4>
       <div className="flex-1">
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: "currentColor", opacity: 0.05 }} content={<CustomThemeTooltip />} />
              <Bar dataKey={barKey} name={metricName} fill="#6366f1" radius={[4, 4, 0, 0]}>
                <LabelList dataKey={barKey} position="top" fill="#64748b" fontSize={11} fontWeight={"bold"} />
              </Bar>
            </BarChart>
         </ResponsiveContainer>
       </div>
    </div>
  )
}

export function CMSPieChart({ widget, config, previewData }: { widget: any, config: any, previewData?: any[] }) {
  const { data, loading, error } = useWidgetData(widget, previewData)
  
  if (loading) return <div className="min-h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  if (error) return <div className="min-h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col gap-2 items-center justify-center text-red-500"><AlertCircle /> {error}</div>

  const keys = data.length > 0 ? Object.keys(data[0]) : []
  const nameKey = config.xAxisKey || config.nameKey || keys[0] || "name"
  const valKey = config.dataKey || keys[1] || "value"
  const metricName = config.metricLabel || "Value"
  const COLORS = ['#3b82f6', '#e5e7eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const total = data.reduce((acc, curr) => acc + (Number(curr[valKey]) || 0), 0)
  const firstValName = data[0]?.[nameKey] || "Opened"
  const firstVal = Number(data[0]?.[valKey]) || 0

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl h-full min-h-64 flex flex-col transition-colors">
       <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{config.title || "Distribution"}</h4>
       <div className="flex-1 relative min-h-[220px]">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie 
                data={data} innerRadius={60} outerRadius={85} dataKey={valKey} nameKey={nameKey} name={metricName} cx="50%" cy="50%" stroke="none"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const mid = midAngle || 0;
                  const x = cx + radius * Math.cos(-mid * RADIAN);
                  const y = cy + radius * Math.sin(-mid * RADIAN);
                  return (
                    <text x={x} y={y} fill={value === 0 ? "transparent" : "#fff"} textAnchor="middle" dominantBaseline="central" className="text-sm font-bold pointer-events-none drop-shadow-md">
                      {value}
                    </text>
                  );
                }}
                labelLine={false}
             >
               {data.map((_, index) => <Cell key={`cell-${index}`} fill={config.colors?.[index] || COLORS[index % COLORS.length]} />)}
             </Pie>
             <RechartsTooltip content={<CustomThemeTooltip />} />
           </PieChart>
         </ResponsiveContainer>
       </div>
       {/* Summary Footer exactly mapping specific user requirement */}
       <div className="text-center pt-3 pb-1 mt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
          {firstValName} / Total: <span className="font-bold text-slate-800 dark:text-slate-200 mx-1">{firstVal} / {total}</span>
       </div>
    </div>
  )
}

export function CMSLineGraph({ widget, config, previewData }: { widget: any, config: any, previewData?: any[] }) {
  const { data, loading, error } = useWidgetData(widget, previewData)
  
  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  if (error) return <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col gap-2 items-center justify-center text-red-500"><AlertCircle /> {error}</div>

  const keys = data.length > 0 ? Object.keys(data[0]) : []
  const xKey = config.xAxisKey || keys[0] || "time"
  const lineKey = config.dataKey || keys[1] || "value"
  const metricName = config.metricLabel || "Value"

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl h-64 flex flex-col transition-colors">
       <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">{config.title || "Time-Series Flow"}</h4>
       <div className="flex-1">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<CustomThemeTooltip />} />
              <Area type="monotone" dataKey={lineKey} name={metricName} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGradient)" />
            </AreaChart>
         </ResponsiveContainer>
       </div>
    </div>
  )
}
