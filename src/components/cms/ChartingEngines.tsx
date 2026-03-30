"use client"

import React, { useEffect, useState } from "react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Cell,
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

export function CMSStatCard({ widget, config, previewData }: { widget: any, config: any, previewData?: any[] }) {
  const { data, loading, error } = useWidgetData(widget, previewData)
  
  if (loading) return <div className="h-48 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  if (error) return <div className="h-48 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 items-center justify-center text-red-500"><AlertCircle /> {error}</div>

  const primaryValue = data[0] ? (Object.values(data[0])[0] as string | number) : "N/A"
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-center items-center h-48">
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{config.title || widget?.componentKey}</h4>
      <span className="text-5xl font-black text-indigo-400 drop-shadow-lg">{primaryValue}</span>
    </div>
  )
}

export function CMSBarChart({ widget, config, previewData }: { widget: any, config: any, previewData?: any[] }) {
  const { data, loading, error } = useWidgetData(widget, previewData)
  
  if (loading) return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  if (error) return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 items-center justify-center text-red-500"><AlertCircle /> {error}</div>

  // Guess the keys dynamically if not provided by config
  const keys = data.length > 0 ? Object.keys(data[0]) : []
  const xKey = config.xAxisKey || keys[0] || "name"
  const barKey = config.dataKey || keys[1] || "value"
  const metricName = config.metricLabel || "Value"

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl h-64 flex flex-col">
       <h4 className="text-sm font-bold text-slate-200 mb-4">{config.title || "Bar Metrics"}</h4>
       <div className="flex-1">
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: "#1e293b" }} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9", borderRadius: "8px" }} formatter={(val: any) => [val, metricName]} />
              <Bar dataKey={barKey} name={metricName} fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
         </ResponsiveContainer>
       </div>
    </div>
  )
}

export function CMSPieChart({ widget, config, previewData }: { widget: any, config: any, previewData?: any[] }) {
  const { data, loading, error } = useWidgetData(widget, previewData)
  
  if (loading) return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  if (error) return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 items-center justify-center text-red-500"><AlertCircle /> {error}</div>

  const keys = data.length > 0 ? Object.keys(data[0]) : []
  const nameKey = config.xAxisKey || config.nameKey || keys[0] || "name"
  const valKey = config.dataKey || keys[1] || "value"
  const metricName = config.metricLabel || "Value"
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl h-64 flex flex-col">
       <h4 className="text-sm font-bold text-slate-200 mb-2">{config.title || "Distribution"}</h4>
       <div className="flex-1 relative">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie data={data} innerRadius={60} outerRadius={80} dataKey={valKey} nameKey={nameKey} name={metricName} cx="50%" cy="50%" stroke="none">
               {data.map((_, index) => <Cell key={`cell-${index}`} fill={config.colors?.[index] || COLORS[index % COLORS.length]} />)}
             </Pie>
             <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9", borderRadius: "8px" }} formatter={(val: any, name: any) => [val, `${metricName} (${name})`]} />
           </PieChart>
         </ResponsiveContainer>
       </div>
    </div>
  )
}

export function CMSLineGraph({ widget, config, previewData }: { widget: any, config: any, previewData?: any[] }) {
  const { data, loading, error } = useWidgetData(widget, previewData)
  
  if (loading) return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  if (error) return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 items-center justify-center text-red-500"><AlertCircle /> {error}</div>

  const keys = data.length > 0 ? Object.keys(data[0]) : []
  const xKey = config.xAxisKey || keys[0] || "time"
  const lineKey = config.dataKey || keys[1] || "value"
  const metricName = config.metricLabel || "Value"

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl h-64 flex flex-col">
       <h4 className="text-sm font-bold text-slate-200 mb-4">{config.title || "Time-Series Flow"}</h4>
       <div className="flex-1">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9", borderRadius: "8px" }} formatter={(val: any) => [val, metricName]} />
              <Area type="monotone" dataKey={lineKey} name={metricName} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGradient)" />
            </AreaChart>
         </ResponsiveContainer>
       </div>
    </div>
  )
}
