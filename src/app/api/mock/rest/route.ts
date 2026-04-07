import { NextResponse } from 'next/server'

// --- DYNAMIC REST DATA GENERATORS ---

const generateMetrics = (count = 15) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `nodedata-ax-${Math.floor(Math.random() * 9000) + 1000}`,
    hostname: `core-worker-${i + 1}`,
    os: i % 3 === 0 ? "Ubuntu 22.04" : "RHEL 9",
    agentStatus: Math.random() > 0.85 ? "Warning" : Math.random() > 0.95 ? "Offline" : "Running",
    appOwner: i % 2 === 0 ? "Analytics Platform" : "Payments Gateway",
    techStack: "Kubernetes Operator",
    cpuUsage: Math.floor(Math.random() * 100),
    memoryUsage: Math.floor(Math.random() * 100),
    syncProgress: Math.floor(Math.random() * 100),
    latencyMs: Math.floor(Math.random() * 200),
    updatedAt: new Date().toISOString()
  }))
}

const generateUsers = (count = 10) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `usr-mock-${i + 1}`,
    name: `Enterprise User ${i + 1}`,
    email: `enterprise${i + 1}@mock-domain.local`,
    role: i === 0 ? "ADMIN" : "VIEWER",
    department: i % 2 === 0 ? "Engineering" : "Operations",
    lastLogin: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    status: Math.random() > 0.1 ? "Active" : "Locked"
  }))
}

const generateTransactions = (count = 10) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `tx-${Math.floor(Math.random() * 100000)}`,
    amount: (Math.random() * 5000).toFixed(2),
    currency: "USD",
    status: Math.random() > 0.9 ? "FAILED" : "SUCCESS",
    gateway: "Stripe",
    timestamp: new Date().toISOString()
  }))
}

const getMockDataByContext = (queryOrPath: string) => {
  const norm = (queryOrPath || "").toLowerCase()
  if (norm.includes('user') || norm.includes('account')) {
    return generateUsers(12)
  }
  if (norm.includes('tx') || norm.includes('transaction') || norm.includes('payment')) {
    return generateTransactions(25)
  }
  // Default to system infrastructure metrics
  return generateMetrics(15)
}

// --- REST API METHODS ---

export async function GET(request: Request) {
  const url = new URL(request.url)
  const fullContext = url.pathname + url.search
  
  return NextResponse.json(getMockDataByContext(fullContext))
}

export async function POST(request: Request) {
  try {
    const textBody = await request.text();
    let body: any = {}
    
    try {
       body = JSON.parse(textBody);
    } catch(e) {
       body = { payload: textBody }
    }

    const payloadStr = JSON.stringify(body).toLowerCase()

    // Standard REST POST response payload
    return NextResponse.json({
       success: true,
       data: getMockDataByContext(payloadStr),
       message: "Simulated REST API POST Request Accepted",
       simulated: true,
       timestamp: new Date().toISOString()
    })
    
  } catch (err: any) {
     return NextResponse.json({ error: "Failed to parse API Mock Payload" }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  return NextResponse.json({ 
    success: true, 
    message: "Simulated REST API PUT Completed Successfully", 
    simulated: true,
    timestamp: new Date().toISOString() 
  })
}

export async function DELETE(request: Request) {
  return NextResponse.json({ 
    success: true, 
    message: "Simulated REST API DELETE Completed Successfully", 
    simulated: true,
    timestamp: new Date().toISOString() 
  })
}
