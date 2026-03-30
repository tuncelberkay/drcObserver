import { NextResponse } from 'next/server'

export async function GET() {
  const metrics = [
    {
      id: "api-01",
      hostname: "API-Node-A",
      os: "Ubuntu 22.04",
      agentStatus: "Running",
      appOwner: "Payments",
      techStack: "Node.js",
      syncProgress: 100,
      updatedAt: new Date().toISOString()
    },
    {
      id: "api-02",
      hostname: "API-Node-B",
      os: "Ubuntu 22.04",
      agentStatus: "Warning",
      appOwner: "Analytics",
      techStack: "Python FastAPI",
      syncProgress: 85,
      updatedAt: new Date().toISOString()
    }
  ]

  return NextResponse.json(metrics)
}
