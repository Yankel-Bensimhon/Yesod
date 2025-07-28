import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Fetch cases based on user role
    let cases
    if (user.role === 'LAWYER' || user.role === 'ADMIN') {
      // Lawyers and admins can see all cases
      cases = await prisma.case.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              company: true
            }
          },
          _count: {
            select: {
              actions: true,
              documents: true,
              messages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Clients can only see their own cases
      cases = await prisma.case.findMany({
        where: {
          userId: user.id
        },
        include: {
          _count: {
            select: {
              actions: true,
              documents: true,
              messages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json(cases)

  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des dossiers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const {
      title,
      description,
      debtorName,
      debtorEmail,
      debtorPhone,
      debtorAddress,
      amount,
      currency,
      invoiceNumber,
      dueDate
    } = await request.json()

    // Validate required fields
    if (!title || !debtorName || !amount) {
      return NextResponse.json(
        { error: 'Titre, nom du débiteur et montant sont requis' },
        { status: 400 }
      )
    }

    const newCase = await prisma.case.create({
      data: {
        title,
        description,
        debtorName,
        debtorEmail,
        debtorPhone,
        debtorAddress,
        amount: parseFloat(amount),
        currency: currency || 'EUR',
        invoiceNumber,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.id,
        status: 'OPEN'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            company: true
          }
        }
      }
    })

    return NextResponse.json(newCase, { status: 201 })

  } catch (error) {
    console.error('Error creating case:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du dossier' },
      { status: 500 }
    )
  }
}