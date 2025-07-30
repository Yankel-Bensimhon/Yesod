// Exemple d'utilisation des deux approches (Prisma + postgres direct)

import { prisma, sql } from '@/lib/database'

// Exemple 1: Utilisation de Prisma (recommandé pour les opérations complexes)
export async function getUsersWithPrisma() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return users
  } catch (error) {
    console.error('Erreur Prisma:', error)
    throw error
  }
}

// Exemple 2: Utilisation du driver postgres direct (pour les requêtes optimisées)
export async function getUsersWithPostgres() {
  try {
    const users = await sql`
      SELECT id, email, name, role, created_at
      FROM "User"
      ORDER BY created_at DESC
    `
    return users
  } catch (error) {
    console.error('Erreur postgres:', error)
    throw error
  }
}

// Exemple 3: Requête complexe avec jointures (postgres direct)
export async function getUserStatistics() {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'CLIENT' THEN 1 END) as clients,
        COUNT(CASE WHEN role = 'LAWYER' THEN 1 END) as lawyers,
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
      FROM "User"
    `
    return stats[0]
  } catch (error) {
    console.error('Erreur statistiques:', error)
    throw error
  }
}

// Exemple 4: Transaction avec Prisma
export async function createUserWithProfile(userData: any, profileData: any) {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      })

      const profile = await tx.profile.create({
        data: {
          ...profileData,
          userId: user.id,
        },
      })

      return { user, profile }
    })
  } catch (error) {
    console.error('Erreur transaction:', error)
    throw error
  }
}
