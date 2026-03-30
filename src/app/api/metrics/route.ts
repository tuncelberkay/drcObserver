import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  // Auth bypassed for prototype testing
  /*
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  */

  // Fetch all host metrics from database
  const metrics = await prisma.hostMetric.findMany()

  // In a real application, if it were empty, we'd return empty. 
  // Since we don't have a seeder, let's inject mock data if empty.
  if (metrics.length === 0) {
    const mockData = [
      { hostname: "prod-db-01", os: "RHEL 8", agentStatus: "Running", appOwner: "Oracle DBA Team", techStack: "Oracle Database", syncProgress: 100 },
      { hostname: "prod-app-01", os: "Ubuntu 22.04", agentStatus: "Warning", appOwner: "Middleware Team", techStack: "Tomcat", syncProgress: 85 },
      { hostname: "prod-web-01", os: "Ubuntu 22.04", agentStatus: "Running", appOwner: "Frontend Team", techStack: "Nginx", syncProgress: 100 },
      { hostname: "prod-redis-cache", os: "Alpine", agentStatus: "Offline", appOwner: "Platform Eng", techStack: "Redis", syncProgress: 45 },
    ]
    
    await prisma.hostMetric.createMany({
      data: mockData
    })
    
    return NextResponse.json(await prisma.hostMetric.findMany())
  }

  return NextResponse.json(metrics)
}
