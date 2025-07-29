// Phase 4: Security & RGPD Middleware
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// =====================================
// SECURITY MIDDLEWARE
// =====================================

export async function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: *.vercel.app",
    "connect-src 'self' *.vercel.app"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

// =====================================
// RATE LIMITING
// =====================================

interface RateLimitData {
  count: number
  resetTime: number
  blocked: boolean
}

const rateLimitStore = new Map<string, RateLimitData>()

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  blockDuration: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const data = rateLimitStore.get(identifier)

  // If no data or window expired
  if (!data || now > data.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
      blocked: false
    })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }

  // If currently blocked
  if (data.blocked && now < data.resetTime) {
    return { allowed: false, remaining: 0, resetTime: data.resetTime }
  }

  // If limit exceeded, block for blockDuration
  if (data.count >= maxRequests) {
    data.blocked = true
    data.resetTime = now + blockDuration
    return { allowed: false, remaining: 0, resetTime: data.resetTime }
  }

  // Increment counter
  data.count++
  return { allowed: true, remaining: maxRequests - data.count, resetTime: data.resetTime }
}

// =====================================
// AUTH SECURITY HELPERS
// =====================================

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentification requise' },
      { status: 401 }
    )
  }
  
  return session
}

export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const session = await requireAuth(request)
  
  if (session instanceof NextResponse) {
    return session // Auth failed
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Permissions insuffisantes' },
      { status: 403 }
    )
  }
  
  return session
}

// =====================================
// PASSWORD SECURITY
// =====================================

export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback = []
  let score = 0

  // Length checks
  if (password.length >= 8) score += 1
  else feedback.push('Au moins 8 caractères requis')

  if (password.length >= 12) score += 1
  else feedback.push('12+ caractères recommandés pour une sécurité optimale')

  // Character type checks
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Au moins une lettre minuscule')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Au moins une lettre majuscule')

  if (/\d/.test(password)) score += 1
  else feedback.push('Au moins un chiffre')

  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  else feedback.push('Au moins un caractère spécial (@, #, $, etc.)')

  // Common password patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /azerty/i,
    /admin/i
  ]

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password))
  if (hasCommonPattern) {
    score = Math.max(0, score - 2)
    feedback.push('Évitez les mots de passe communs')
  }

  return {
    isValid: score >= 4 && password.length >= 8,
    score: Math.min(score, 6),
    feedback
  }
}

// =====================================
// AUDIT LOGGING (Simple version)
// =====================================

interface SecurityLogEntry {
  timestamp: string
  userId?: string
  action: string
  resource: string
  ip?: string
  userAgent?: string
  metadata?: any
}

const securityLogs: SecurityLogEntry[] = []

export function logSecurityEvent(
  action: string,
  resource: string,
  userId?: string,
  request?: NextRequest,
  metadata?: any
) {
  const entry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    ip: getClientIP(request),
    userAgent: request?.headers.get('user-agent') || undefined,
    metadata
  }

  securityLogs.push(entry)
  
  // Keep only last 1000 entries in memory
  if (securityLogs.length > 1000) {
    securityLogs.shift()
  }

  // Log critical events immediately
  if (action.includes('CRITICAL') || action.includes('BREACH')) {
    console.error('🚨 CRITICAL SECURITY EVENT:', entry)
  } else {
    console.log('🔒 Security Event:', entry)
  }
}

export function getSecurityLogs(limit: number = 100): SecurityLogEntry[] {
  return securityLogs.slice(-limit)
}

// =====================================
// RGPD HELPERS
// =====================================

export interface ConsentData {
  userId?: string
  purpose: string
  isConsented: boolean
  timestamp: string
  version: string
}

const consentStore = new Map<string, ConsentData[]>()

export function recordConsent(
  identifier: string,
  purpose: string,
  isConsented: boolean,
  version: string = '1.0'
) {
  const consent: ConsentData = {
    purpose,
    isConsented,
    timestamp: new Date().toISOString(),
    version
  }

  const existing = consentStore.get(identifier) || []
  existing.push(consent)
  consentStore.set(identifier, existing)

  logSecurityEvent('CONSENT_RECORDED', 'Consent', identifier, undefined, {
    purpose,
    isConsented,
    version
  })
}

export function getConsents(identifier: string): ConsentData[] {
  return consentStore.get(identifier) || []
}

export function hasValidConsent(identifier: string, purpose: string): boolean {
  const consents = getConsents(identifier)
  const latestConsent = consents
    .filter(c => c.purpose === purpose)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

  return latestConsent?.isConsented || false
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

function getClientIP(request?: NextRequest): string | undefined {
  if (!request) return undefined

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return undefined
}

// =====================================
// ENCRYPTION HELPERS (Basic)
// =====================================

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

export class SimpleEncryption {
  private static getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
    return crypto.scryptSync(key, 'salt', 32)
  }

  static encrypt(text: string): string {
    try {
      const key = this.getKey()
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher(ALGORITHM, key)
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
      console.error('Encryption error:', error)
      return text // Fallback to plain text in case of error
    }
  }

  static decrypt(encryptedText: string): string {
    try {
      if (!encryptedText.includes(':')) {
        return encryptedText // Not encrypted
      }

      const key = this.getKey()
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
      
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      const decipher = crypto.createDecipher(ALGORITHM, key)
      
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      return encryptedText // Return as-is if decryption fails
    }
  }
}

// =====================================
// DATA ANONYMIZATION
// =====================================

export function anonymizeEmail(email: string): string {
  const [username, domain] = email.split('@')
  if (!username || !domain) return 'anonymous@deleted.local'
  
  const anonymized = `anonymous_${crypto.randomBytes(4).toString('hex')}`
  return `${anonymized}@deleted.local`
}

export function anonymizeName(name: string): string {
  return `Anonymous_${crypto.randomBytes(4).toString('hex')}`
}

export function anonymizePhone(phone: string): string {
  return 'XXX-XXX-XXXX'
}

export function anonymizeAddress(address: string): string {
  return 'Address Anonymized'
}
