// Phase 4: Security & RGPD Utilities
import { prisma } from './prisma'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

// Import types from generated Prisma client
type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'DOWNLOAD' | 'SHARE' | 'PERMISSION_CHANGE' | 'PASSWORD_CHANGE' | 'TWO_FA_ENABLE' | 'TWO_FA_DISABLE' | 'DATA_EXPORT' | 'DATA_DELETION'
type SecurityEventType = 'LOGIN_ATTEMPT' | 'LOGIN_FAILURE' | 'PASSWORD_CHANGE' | 'TWO_FA_BYPASS_ATTEMPT' | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH' | 'SUSPICIOUS_ACTIVITY' | 'MALWARE_DETECTION' | 'PRIVILEGE_ESCALATION' | 'DATA_EXPORT' | 'MASSIVE_DOWNLOAD' | 'API_ABUSE'
type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type LegalBasis = 'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION' | 'VITAL_INTERESTS' | 'PUBLIC_TASK' | 'LEGITIMATE_INTERESTS'

// =====================================
// AUDIT TRAIL SYSTEM
// =====================================

interface AuditLogData {
  userId?: string
  action: AuditAction
  resource: string
  resourceId?: string
  oldValues?: any
  newValues?: any
  metadata?: any
  request?: NextRequest
}

export async function createAuditLog(data: AuditLogData) {
  try {
    // Temporary implementation - will be replaced when Prisma is fully synced
    console.log('Audit Log:', {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      timestamp: new Date().toISOString(),
      ip: getClientIP(data.request)
    })
    
    // TODO: Uncomment when Prisma client is updated
    /*
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        metadata: data.metadata,
        ipAddress: getClientIP(data.request),
        userAgent: data.request?.headers.get('user-agent'),
        sessionId: data.request?.headers.get('x-session-id'),
      }
    })
    
    return auditLog
    */
    return { id: 'temp', logged: true }
  } catch (error) {
    console.error('Failed to create audit log:', error)
    return null
  }
}

// =====================================
// SECURITY MONITORING
// =====================================

interface SecurityEventData {
  type: SecurityEventType
  severity: SecuritySeverity
  description: string
  userId?: string
  metadata?: any
  request?: NextRequest
}

export async function recordSecurityEvent(data: SecurityEventData) {
  try {
    const securityEvent = await prisma.securityEvent.create({
      data: {
        type: data.type,
        severity: data.severity,
        description: data.description,
        source: 'api',
        ...(data.userId && { userId: data.userId }),
        metadata: data.metadata,
        ipAddress: getClientIP(data.request),
        userAgent: data.request?.headers.get('user-agent'),
      }
    })

    // Alert for critical events
    if (data.severity === 'CRITICAL') {
      await alertSecurityTeam(securityEvent)
    }

    return securityEvent
  } catch (error) {
    console.error('Failed to record security event:', error)
    return null
  }
}

// =====================================
// DATA ENCRYPTION
// =====================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32

export class DataEncryption {
  private static getEncryptionKey(keyName: string): Buffer {
    // In production, retrieve from secure key management
    const keyString = process.env[`ENCRYPTION_KEY_${keyName}`] || process.env.MASTER_ENCRYPTION_KEY
    if (!keyString) {
      throw new Error(`Encryption key ${keyName} not found`)
    }
    return Buffer.from(keyString, 'hex')
  }

  static async encryptSensitiveData(
    data: string,
    tableName: string,
    fieldName: string,
    recordId: string,
    keyName: string = 'DEFAULT'
  ): Promise<string> {
    try {
      const key = this.getEncryptionKey(keyName)
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, key)
      
      cipher.setAAD(Buffer.from(`${tableName}:${fieldName}:${recordId}`))
      
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()
      const encryptedValue = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`

      // Store encrypted data reference
      await prisma.encryptedData.upsert({
        where: {
          tableName_fieldName_recordId: {
            tableName,
            fieldName,
            recordId
          }
        },
        update: {
          encryptedValue,
          keyId: keyName
        },
        create: {
          keyId: keyName,
          tableName,
          fieldName,
          recordId,
          encryptedValue
        }
      })

      return encryptedValue
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Data encryption failed')
    }
  }

  static async decryptSensitiveData(
    tableName: string,
    fieldName: string,
    recordId: string
  ): Promise<string | null> {
    try {
      const encryptedData = await prisma.encryptedData.findUnique({
        where: {
          tableName_fieldName_recordId: {
            tableName,
            fieldName,
            recordId
          }
        },
        include: {
          key: true
        }
      })

      if (!encryptedData) {
        return null
      }

      const key = this.getEncryptionKey(encryptedData.key.keyName)
      const [ivHex, authTagHex, encrypted] = encryptedData.encryptedValue.split(':')
      
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, key)
      
      decipher.setAAD(Buffer.from(`${tableName}:${fieldName}:${recordId}`))
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      return null
    }
  }
}

// =====================================
// RGPD COMPLIANCE UTILITIES
// =====================================

export class RGPDCompliance {
  // Record user consent
  static async recordConsent(
    userId: string | null,
    clientId: string | null,
    purpose: string,
    legalBasis: string,
    isConsented: boolean,
    version: string = '1.0'
  ) {
    return await prisma.dataProcessingConsent.create({
      data: {
        userId,
        clientId,
        purpose,
        legalBasis: legalBasis as any,
        isConsented,
        consentDate: isConsented ? new Date() : null,
        version,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'web-interface'
        }
      }
    })
  }

  // Withdraw consent
  static async withdrawConsent(consentId: string, reason?: string) {
    return await prisma.dataProcessingConsent.update({
      where: { id: consentId },
      data: {
        isConsented: false,
        withdrawalDate: new Date(),
        metadata: {
          withdrawalReason: reason,
          withdrawalTimestamp: new Date().toISOString()
        }
      }
    })
  }

  // Create right to erasure request
  static async createErasureRequest(
    requesterId: string,
    requesterType: 'user' | 'client',
    scope: any,
    reason?: string
  ) {
    return await prisma.rightToErasureRequest.create({
      data: {
        requesterId,
        requesterType,
        reason,
        scope,
        status: 'PENDING'
      }
    })
  }

  // Anonymize user data
  static async anonymizeUserData(userId: string) {
    const anonymizedData = {
      name: `Anonymous_${crypto.randomBytes(4).toString('hex')}`,
      email: `anonymous_${crypto.randomBytes(8).toString('hex')}@deleted.local`,
      phone: null,
      address: null,
      company: null,
    }

    // Update user with anonymized data
    await prisma.user.update({
      where: { id: userId },
      data: anonymizedData
    })

    // Create audit log
    await createAuditLog({
      userId,
      action: 'DATA_DELETION',
      resource: 'User',
      resourceId: userId,
      metadata: {
        type: 'anonymization',
        timestamp: new Date().toISOString()
      }
    })

    return anonymizedData
  }
}

// =====================================
// TWO-FACTOR AUTHENTICATION
// =====================================

export class TwoFactorAuth {
  static generateSecret(): string {
    // Generate 32 bytes (256 bits) for strong TOTP secret - 64 hex characters
    return crypto.randomBytes(32).toString('hex')
  }

  static generateBackupCodes(): string[] {
    const codes = []
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
    }
    return codes
  }

  static async enableTwoFactor(userId: string) {
    const secret = this.generateSecret()
    const backupCodes = this.generateBackupCodes()
    const hashedCodes = backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex'))

    return await prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        isEnabled: true,
        secret,
        backupCodes: hashedCodes,
        lastUsedAt: new Date()
      },
      create: {
        userId,
        isEnabled: true,
        secret,
        backupCodes: hashedCodes
      }
    })
  }

  static async disableTwoFactor(userId: string) {
    return await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        isEnabled: false,
        secret: null,
        backupCodes: []
      }
    })
  }
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

function getClientIP(request?: NextRequest): string | null {
  if (!request) return null
  
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  // NextRequest doesn't have ip property, use forwarded headers instead
  return null
}

async function alertSecurityTeam(event: any) {
  // In production, implement actual alerting (email, Slack, PagerDuty, etc.)
  console.error('🚨 CRITICAL SECURITY EVENT:', {
    id: event.id,
    type: event.type,
    description: event.description,
    timestamp: event.createdAt
  })
  
  // Could integrate with external services:
  // - Send email to security team
  // - Post to Slack channel
  // - Create PagerDuty incident
  // - Log to SIEM system
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback = []
  let score = 0

  if (password.length >= 8) score += 1
  else feedback.push('Au moins 8 caractères')

  if (password.length >= 12) score += 1
  else feedback.push('12+ caractères recommandés')

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Au moins une minuscule')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Au moins une majuscule')

  if (/\d/.test(password)) score += 1
  else feedback.push('Au moins un chiffre')

  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  else feedback.push('Au moins un caractère spécial')

  return {
    isValid: score >= 4,
    score,
    feedback
  }
}

// Rate limiting for security
const rateLimits = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const limit = rateLimits.get(identifier)

  if (!limit || now > limit.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs }
  }

  if (limit.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: limit.resetTime }
  }

  limit.count++
  return { allowed: true, remaining: maxAttempts - limit.count, resetTime: limit.resetTime }
}
