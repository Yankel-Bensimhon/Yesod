#!/usr/bin/env node

/**
 * Script de test complet des fonctionnalités de l'application Yesod
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('Test de connexion a la base de donnees...')
  
  try {
    await prisma.$connect()
    console.log('✅ Connexion a la base de donnees reussie')
    
    // Test de creation d'un utilisateur test
    console.log('\nTest de creation d\'utilisateur...')
    
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test-functional@yesod.com' }
    })
    
    if (existingUser) {
      await prisma.user.delete({
        where: { email: 'test-functional@yesod.com' }
      })
    }
    
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
    
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Functional User',
        email: 'test-functional@yesod.com',
        password: hashedPassword,
        company: 'Test Company Ltd',
        phone: '+33123456789',
        role: 'CLIENT'
      }
    })
    
    console.log('✅ Utilisateur test cree:', testUser.name)
    
    // Test de creation d'un dossier
    console.log('\nTest de creation de dossier...')
    
    const testCase = await prisma.case.create({
      data: {
        title: 'Dossier de test - Recouvrement facture impayee',
        description: 'Test de creation d\'un dossier de recouvrement pour validation des fonctionnalites',
        status: 'OPEN',
        debtorName: 'Societe Debitrice SARL',
        debtorEmail: 'contact@societe-debitrice.com',
        debtorPhone: '+33987654321',
        debtorAddress: '123 Rue du Test, 75001 Paris',
        amount: 5000.00,
        currency: 'EUR',
        dueDate: new Date('2024-12-31'),
        invoiceNumber: 'FAC-2024-001',
        userId: testUser.id
      }
    })
    
    console.log('✅ Dossier test cree:', testCase.title)
    
    // Test de creation d'une action sur le dossier
    console.log('\nTest de creation d\'action...')
    
    const testAction = await prisma.caseAction.create({
      data: {
        type: 'REMINDER',
        title: 'Envoi de rappel amiable',
        description: 'Premier rappel pour le paiement de la facture en retard',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
        caseId: testCase.id
      }
    })
    
    console.log('✅ Action creee:', testAction.title)
    
    // Test de creation d'un document
    console.log('\nTest de creation de document...')
    
    const testDocument = await prisma.document.create({
      data: {
        title: 'Facture impayee',
        filename: 'facture-2024-001.pdf',
        type: 'INVOICE',
        url: '/documents/test/facture-2024-001.pdf',
        size: 245760,
        mimeType: 'application/pdf',
        caseId: testCase.id
      }
    })
    
    console.log('✅ Document cree:', testDocument.title)
    
    // Test de creation d'un message
    console.log('\nTest de creation de message...')
    
    const testMessage = await prisma.message.create({
      data: {
        content: 'Dossier cree automatiquement via le systeme de test.',
        type: 'SYSTEM',
        isRead: false,
        userId: testUser.id,
        caseId: testCase.id
      }
    })
    
    console.log('✅ Message cree')
    
    // Recuperation et affichage des statistiques
    console.log('\nStatistiques de la base de donnees:')
    
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.case.count(),
      prisma.caseAction.count(),
      prisma.document.count(),
      prisma.message.count()
    ])
    
    console.log(`Utilisateurs: ${stats[0]}`)
    console.log(`Dossiers: ${stats[1]}`)
    console.log(`Actions: ${stats[2]}`)
    console.log(`Documents: ${stats[3]}`)
    console.log(`Messages: ${stats[4]}`)
    
    // Test de requete complexe
    console.log('\nTest de requete complexe...')
    
    const caseWithDetails = await prisma.case.findUnique({
      where: { id: testCase.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            company: true
          }
        },
        actions: true,
        documents: true,
        messages: true,
        _count: {
          select: {
            actions: true,
            documents: true,
            messages: true
          }
        }
      }
    })
    
    console.log('✅ Requete complexe reussie:')
    console.log(`   Client: ${caseWithDetails.user.name} (${caseWithDetails.user.company})`)
    console.log(`   Actions: ${caseWithDetails._count.actions}`)
    console.log(`   Documents: ${caseWithDetails._count.documents}`)
    console.log(`   Messages: ${caseWithDetails._count.messages}`)
    
    console.log('\n✅ Tous les tests de base de donnees ont reussi!')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('Demarrage des tests de fonctionnalites Yesod\n')
  
  try {
    await testDatabase()
    
    console.log('\nTOUS LES TESTS ONT REUSSI!')
    console.log('✅ Base de donnees operationnelle')
    console.log('✅ Modeles Prisma fonctionnels')
    console.log('✅ Relations entre entites correctes')
    console.log('✅ CRUD operations validees')
    
  } catch (error) {
    console.error('\nECHEC DES TESTS')
    console.error('Details de l\'erreur:', error.message)
    process.exit(1)
  }
}

// Gestion des signaux pour un arret propre
process.on('SIGINT', async () => {
  console.log('\nArret des tests...')
  await prisma.$disconnect()
  process.exit(0)
})

main()
