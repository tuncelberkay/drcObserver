export function applyDataReduction(data: any, config: any) {
  if (!config?.groupBy || typeof config.groupBy !== "string" || config.groupBy.trim() === "") {
    return data
  }

  // Ensure 'data' is an array of objects
  const rawArray = Array.isArray(data) ? data : [data]

  const grouped = rawArray.reduce((acc, curr) => {
    // Determine string literal key gracefully
    const key = curr[config.groupBy] !== undefined && curr[config.groupBy] !== null 
       ? String(curr[config.groupBy]) 
       : "Unknown"
       
    if (!acc[key]) acc[key] = { items: [] }
    acc[key].items.push(curr)
    
    return acc
  }, {} as Record<string, { items: any[] }>)

  // Process Aggregation Strategy smoothly implicitly 
  const reducedData = Object.entries(grouped).map(([key, group]: [string, any]) => {
    let aggValue = 0

    if (config.aggType === "COUNT") {
      aggValue = group.items.length
    } else if (config.aggType === "SUM") {
      aggValue = group.items.reduce((s: number, i: any) => s + (Number(i[config.groupBy]) || 0), 0)
    } else if (config.aggType === "AVG") {
      const sum = group.items.reduce((s: number, i: any) => s + (Number(i[config.groupBy]) || 0), 0)
      aggValue = sum / Math.max(1, group.items.length)
    } else {
      aggValue = group.items.length // default fallback cleanly accurately.
    }

    return {
      name: key,
      value: aggValue
    }
  })

  return reducedData
}
