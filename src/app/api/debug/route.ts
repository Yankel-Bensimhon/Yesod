import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    has_database_url: !!process.env.DATABASE_URL,
    has_nextauth_url: !!process.env.NEXTAUTH_URL,
    has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
    nextauth_url_value: process.env.NEXTAUTH_URL,
    database_url_starts_with: process.env.DATABASE_URL?.substring(0, 20) + '...',
    node_env: process.env.NODE_ENV
  }

  return NextResponse.json({
    status: 'debug',
    timestamp: new Date().toISOString(),
    environment_variables: envVars
  })
}
