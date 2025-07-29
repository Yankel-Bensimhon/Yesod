import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      database: false,
      nextauth: false,
      variables: false
    },
    errors: [] as string[],
    variables: {
      has_database_url: !!process.env.DATABASE_URL,
      has_nextauth_url: !!process.env.NEXTAUTH_URL,
      has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
      nextauth_url: process.env.NEXTAUTH_URL,
      database_url_format: process.env.DATABASE_URL?.startsWith('postgresql://') ? 'valid' : 'invalid'
    }
  }

  // Test database connection
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    checks.checks.database = true
  } catch (error) {
    checks.errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Test NextAuth configuration
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_SECRET) {
    checks.checks.nextauth = true
  } else {
    checks.errors.push('NextAuth: Missing NEXTAUTH_URL or NEXTAUTH_SECRET')
  }

  // Test environment variables
  if (process.env.DATABASE_URL && process.env.NEXTAUTH_URL && process.env.NEXTAUTH_SECRET) {
    checks.checks.variables = true
  } else {
    checks.errors.push('Variables: Missing required environment variables')
  }

  const allChecksPass = Object.values(checks.checks).every(check => check === true)
  const status = allChecksPass ? 200 : 500

  return NextResponse.json({
    status: allChecksPass ? 'healthy' : 'unhealthy',
    ...checks
  }, { status })
}
