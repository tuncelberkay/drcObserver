import fs from 'fs'
import path from 'path'

export interface DrcSystemConfig {
  setupCompleted: boolean
  dbProvider: 'sqlite' | 'mysql' | 'postgresql' | 'oracle'
  connectionUrl: string
  cyberarkApiUrl?: string
}

const CONFIG_PATH = path.join(process.cwd(), 'drc-system.json')

const DEFAULT_CONFIG: DrcSystemConfig = {
  setupCompleted: false,
  dbProvider: 'sqlite',
  connectionUrl: 'file:./dev.db'
}

export function getSystemConfig(): DrcSystemConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    }
  } catch (e) {
    console.warn("Failed to read drc-system.json", e)
  }
  return DEFAULT_CONFIG
}

export function saveSystemConfig(config: Partial<DrcSystemConfig>) {
  const current = getSystemConfig()
  const updated = { ...current, ...config }
  
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2))
  return updated
}
