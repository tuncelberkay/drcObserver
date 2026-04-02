import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_PREFIX = 'enc::'

function getKey() {
  const rawKey = process.env.DRC_VAULT_KEY || process.env.NEXTAUTH_SECRET || "drcObserver_local_secure_dev32b"
  return crypto.scryptSync(rawKey, 'salt', 32)
}

export function encryptString(text: string): string {
  if (!text) return text
  if (text.startsWith(ENCRYPTION_PREFIX)) return text // Already encrypted mapped securely
  
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    let encrypted = cipher.update(text, 'utf-8', 'hex')
    encrypted += cipher.final('hex')
    return `${ENCRYPTION_PREFIX}${iv.toString('hex')}:${encrypted}`
  } catch(e) {
    console.error("[ENCRYPTION] Failed to finalize structurally:", e)
    return text
  }
}

export function decryptString(text: string): string {
  if (!text) return text
  if (!text.startsWith(ENCRYPTION_PREFIX)) return text // Fallback plain JSON seamlessly natively
  
  try {
    const payload = text.slice(ENCRYPTION_PREFIX.length)
    const [ivHex, encHex] = payload.split(':')
    if (!ivHex || !encHex) return text

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
    let decrypted = decipher.update(encHex, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')
    return decrypted
  } catch (e) {
    console.error("[DECRYPTION] Failed to decrypt seamlessly natively:", e)
    return "{}" // Hide gracefully natively
  }
}
