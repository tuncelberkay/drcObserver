"use client"

import React, { useState, useEffect } from "react"
import { Responsive, WidthProvider } from "react-grid-layout/legacy"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from "recharts"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { Activity, Server, Network, Settings, Check, SlidersHorizontal, BarChart2, PieChart as PieIcon, LineChart as AreaIcon } from "lucide-react"
import { useTranslations } from "next-intl"

const ResponsiveGridLayout = WidthProvider(Responsive)

const PIE_DATA = [
  { name: "Operational", value: 85, color: "#10B981" },
  { name: "Pending DRC", value: 15, color: "#F59E0B" }
]

const AREA_DATA = [
  { time: '10:00', load: 45 },
  { time: '10:05', load: 52 },
  { time: '10:10', load: 68 },
  { time: '10:15', load: 74 },
  { time: '10:20', load: 65 },
]

interface DraggableGridProps {
  widget?: any
  config?: any
}

export function DraggableGrid({ widget, config }: DraggableGridProps) {
  const t = useTranslations('Dashboard')
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeWidgetMenu, setActiveWidgetMenu] = useState<string | null>(null)
  
  const [widgetConfigs, setWidgetConfigs] = useState<Record<string, { visible: boolean, type: string }>>({
    "oracle-status": { visible: true, type: "pie" },
    "network-health": { visible: true, type: "metric" },
    "server-load": { visible: true, type: "progress" },
  })

  const WIDGET_OPTIONS = [
    { id: "oracle-status", title: t('oracle_status') },
    { id: "network-health", title: t('network') },
    { id: "server-load", title: t('server_load') },
  ]
  
  const toggleVisibility = (id: string) => {
    setWidgetConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible }
    }))
  }

  const toggleType = (id: string, type: string) => {
    setWidgetConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], type }
    }))
    setActiveWidgetMenu(null)
  }

  const layout = [
    { i: "oracle-status", x: 0, y: 0, w: 6, h: 4 },
    { i: "network-health", x: 6, y: 0, w: 6, h: 2 },
    { i: "server-load", x: 6, y: 2, w: 6, h: 2 },
  ].filter(l => widgetConfigs[l.i].visible)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-screen flex items-center justify-center">Loading Widgets...</div>

  return (
    <div className="p-4" onClick={() => setActiveWidgetMenu(null)}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">{t('title')}</h2>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full flex items-center gap-2">
            <Activity className="w-4 h-4" /> {t('live_sync')}
          </span>
          
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-sm"
            >
              <Settings className="w-4 h-4" /> {t('settings')}
            </button>
            
            {menuOpen && (
              <div onClick={e => e.stopPropagation()} className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Available Widgets</h4>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  {WIDGET_OPTIONS.map(opt => {
                    const isVisible = widgetConfigs[opt.id].visible
                    return (
                      <button 
                        key={opt.id}
                        onClick={() => toggleVisibility(opt.id)}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-left transition-colors cursor-pointer"
                      >
                        <span className={isVisible ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>{opt.title}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isVisible ? "bg-indigo-500 border-indigo-500" : "border-slate-600"}`}>
                          {isVisible && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        draggableHandle=".drag-handle"
      >
        {widgetConfigs["oracle-status"].visible && (
          <div key="oracle-status" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg flex flex-col transition-colors">
            <div className="drag-handle bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2 pointer-events-none">
                <Server className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('oracle_status')}</h3>
              </div>
              
              <div className="flex gap-1 relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveWidgetMenu(activeWidgetMenu === "oracle-status" ? null : "oracle-status"); }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                
                {activeWidgetMenu === "oracle-status" && (
                  <div onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-xl z-50 p-1 flex flex-col gap-1 overflow-hidden">
                     <button onClick={() => toggleType("oracle-status", "pie")} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${widgetConfigs["oracle-status"].type === "pie" ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><PieIcon className="w-4 h-4" /> Pie Chart</button>
                     <button onClick={() => toggleType("oracle-status", "bar")} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${widgetConfigs["oracle-status"].type === "bar" ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><BarChart2 className="w-4 h-4" /> Bar Chart</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 p-4 relative">
              {widgetConfigs["oracle-status"].type === "pie" ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={PIE_DATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {PIE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">85%</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Sync Complete</span>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col justify-end pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PIE_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={100} />
                      <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {PIE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {widgetConfigs["network-health"].visible && (
          <div key="network-health" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg flex flex-col transition-colors">
            <div className="drag-handle bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2 pointer-events-none">
                <Network className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('network')}</h3>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="text-center">
                <span className="text-4xl font-extrabold text-emerald-500">12ms</span>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Status: Excellent</p>
              </div>
            </div>
          </div>
        )}

        {widgetConfigs["server-load"].visible && (
          <div key="server-load" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg flex flex-col transition-colors">
            <div className="drag-handle bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2 pointer-events-none">
                <Activity className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('server_load')}</h3>
              </div>
              
              <div className="flex gap-1 relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveWidgetMenu(activeWidgetMenu === "server-load" ? null : "server-load"); }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                
                {activeWidgetMenu === "server-load" && (
                  <div onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-xl z-50 p-1 flex flex-col gap-1 overflow-hidden">
                     <button onClick={() => toggleType("server-load", "progress")} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${widgetConfigs["server-load"].type === "progress" ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><BarChart2 className="w-4 h-4" /> Generic Progress</button>
                     <button onClick={() => toggleType("server-load", "area")} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${widgetConfigs["server-load"].type === "area" ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><AreaIcon className="w-4 h-4" /> Load Area Chart</button>
                  </div>
                )}
              </div>
            </div>
            
            {widgetConfigs["server-load"].type === "progress" ? (
              <div className="flex-1 p-6 flex flex-col justify-center">
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 overflow-hidden relative">
                  <div className="bg-indigo-500 h-full rounded-full w-[65%]" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 mt-2 text-right">65%</span>
              </div>
            ) : (
              <div className="flex-1 p-4 pt-6 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={AREA_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                    <Area type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </ResponsiveGridLayout>
    </div>
  )
}
