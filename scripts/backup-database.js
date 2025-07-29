#!/usr/bin/env node
// Système de backup automatisé PostgreSQL - Phase 1 Fondations
const { execSync } = require('child_process')
const { promises: fs } = require('fs')
const path = require('path')
const crypto = require('crypto')

class DatabaseBackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups'
    this.s3Bucket = process.env.BACKUP_S3_BUCKET
    this.retention = {
      daily: 7,    // 7 jours
      weekly: 4,   // 4 semaines
      monthly: 12  // 12 mois
    }
    this.compression = process.env.BACKUP_COMPRESSION !== 'false'
    this.encryption = process.env.BACKUP_ENCRYPT === 'true'
  }

  async createBackup(environment = 'production') {
    console.log(`🚀 Démarrage du backup ${environment}...`)
    
    try {
      // 1. Créer le répertoire de backup
      await this.ensureBackupDirectory()
      
      // 2. Générer le nom du fichier
      const filename = this.generateBackupFilename(environment)
      const backupPath = path.join(this.backupDir, filename)
      
      // 3. Obtenir l'URL de la base de données
      const databaseUrl = this.getDatabaseUrl(environment)
      
      // 4. Créer le backup
      console.log(`📦 Création du backup: ${filename}`)
      await this.performBackup(databaseUrl, backupPath)
      
      // 5. Compression si activée
      if (this.compression) {
        console.log(`🗜️ Compression du backup...`)
        await this.compressBackup(backupPath)
      }
      
      // 6. Chiffrement si activé
      if (this.encryption) {
        console.log(`🔒 Chiffrement du backup...`)
        await this.encryptBackup(backupPath)
      }
      
      // 7. Validation du backup
      console.log(`✅ Validation du backup...`)
      await this.validateBackup(backupPath)
      
      // 8. Upload vers le stockage cloud si configuré
      if (this.s3Bucket) {
        console.log(`☁️ Upload vers S3...`)
        await this.uploadToS3(backupPath)
      }
      
      // 9. Nettoyage des anciens backups
      console.log(`🧹 Nettoyage des anciens backups...`)
      await this.cleanupOldBackups()
      
      // 10. Rapport de succès
      const stats = await this.getBackupStats(backupPath)
      console.log(`✨ Backup terminé avec succès!`)
      console.log(`   Fichier: ${filename}`)
      console.log(`   Taille: ${this.formatFileSize(stats.size)}`)
      console.log(`   Durée: ${stats.duration}ms`)
      
      return {
        success: true,
        filename,
        path: backupPath,
        size: stats.size,
        duration: stats.duration
      }
      
    } catch (error) {
      console.error(`❌ Erreur lors du backup:`, error)
      await this.notifyBackupFailure(error, environment)
      throw error
    }
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir)
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true })
    }
  }

  generateBackupFilename(environment) {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-')
    const type = this.getBackupType(now)
    
    return `yesod-${environment}-${type}-${timestamp}.sql`
  }

  getBackupType(date) {
    const day = date.getDay()
    const dateNum = date.getDate()
    
    // Backup mensuel le 1er de chaque mois
    if (dateNum === 1) return 'monthly'
    
    // Backup hebdomadaire le dimanche
    if (day === 0) return 'weekly'
    
    // Backup quotidien par défaut
    return 'daily'
  }

  getDatabaseUrl(environment) {
    switch (environment) {
      case 'production':
        return process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL
      case 'staging':
        return process.env.STAGING_DATABASE_URL
      case 'development':
        return process.env.DEV_DATABASE_URL || process.env.DATABASE_URL
      default:
        return process.env.DATABASE_URL
    }
  }

  async performBackup(databaseUrl, backupPath) {
    const startTime = Date.now()
    
    try {
      // Options pg_dump pour un backup complet
      const pgDumpOptions = [
        '--verbose',
        '--no-password',
        '--format=custom',
        '--clean',
        '--create',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        `--file=${backupPath}`
      ]

      // Exécuter pg_dump
      execSync(`pg_dump ${pgDumpOptions.join(' ')} "${databaseUrl}"`, {
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      })
      
      return Date.now() - startTime
      
    } catch (error) {
      throw new Error(`Échec de pg_dump: ${error.message}`)
    }
  }

  async compressBackup(backupPath) {
    const compressedPath = `${backupPath}.gz`
    
    try {
      execSync(`gzip -9 "${backupPath}"`, { stdio: 'pipe' })
      
      // Renommer pour garder l'extension .sql
      await fs.rename(compressedPath, `${backupPath}.gz`)
      
    } catch (error) {
      throw new Error(`Échec de compression: ${error.message}`)
    }
  }

  async encryptBackup(backupPath) {
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('Clé de chiffrement manquante')
    }
    
    const encryptedPath = `${backupPath}.enc`
    
    try {
      const algorithm = 'aes-256-gcm'
      const key = crypto.scryptSync(encryptionKey, 'salt', 32)
      const iv = crypto.randomBytes(16)
      
      const cipher = crypto.createCipher(algorithm, key, iv)
      
      const input = await fs.readFile(backupPath)
      const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()])
      
      await fs.writeFile(encryptedPath, encrypted)
      await fs.unlink(backupPath) // Supprimer le fichier non chiffré
      
      await fs.rename(encryptedPath, backupPath)
      
    } catch (error) {
      throw new Error(`Échec du chiffrement: ${error.message}`)
    }
  }

  async validateBackup(backupPath) {
    try {
      const stats = await fs.stat(backupPath)
      
      if (stats.size === 0) {
        throw new Error('Le fichier de backup est vide')
      }
      
      if (stats.size < 1024) { // Moins de 1KB
        throw new Error('Le fichier de backup semble trop petit')
      }
      
      return true
      
    } catch (error) {
      throw new Error(`Validation échouée: ${error.message}`)
    }
  }

  async uploadToS3(backupPath) {
    if (!this.s3Bucket) return
    
    try {
      const filename = path.basename(backupPath)
      const s3Key = `backups/${new Date().getFullYear()}/${filename}`
      
      // Utiliser AWS CLI pour l'upload
      execSync(`aws s3 cp "${backupPath}" "s3://${this.s3Bucket}/${s3Key}"`, {
        stdio: 'pipe'
      })
      
      console.log(`   ☁️ Uploadé vers s3://${this.s3Bucket}/${s3Key}`)
      
    } catch (error) {
      console.warn(`⚠️ Échec upload S3: ${error.message}`)
      // Ne pas faire échouer le backup pour un problème d'upload
    }
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir)
      const backupFiles = files.filter(f => f.includes('yesod-') && f.endsWith('.sql'))
      
      const filesByType = {
        daily: [],
        weekly: [],
        monthly: []
      }
      
      // Trier les fichiers par type
      for (const file of backupFiles) {
        const type = this.extractBackupType(file)
        if (type && filesByType[type]) {
          const fullPath = path.join(this.backupDir, file)
          const stats = await fs.stat(fullPath)
          filesByType[type].push({
            file,
            path: fullPath,
            mtime: stats.mtime
          })
        }
      }
      
      // Nettoyer chaque type selon la rétention
      for (const [type, files] of Object.entries(filesByType)) {
        if (files.length > this.retention[type]) {
          // Trier par date (plus ancien en premier)
          files.sort((a, b) => a.mtime - b.mtime)
          
          const toDelete = files.slice(0, files.length - this.retention[type])
          
          for (const fileInfo of toDelete) {
            await fs.unlink(fileInfo.path)
            console.log(`   🗑️ Supprimé: ${fileInfo.file}`)
          }
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Erreur lors du nettoyage: ${error.message}`)
    }
  }

  extractBackupType(filename) {
    if (filename.includes('-daily-')) return 'daily'
    if (filename.includes('-weekly-')) return 'weekly'
    if (filename.includes('-monthly-')) return 'monthly'
    return null
  }

  async getBackupStats(backupPath) {
    try {
      const stats = await fs.stat(backupPath)
      return {
        size: stats.size,
        duration: 0 // Sera calculé par le caller
      }
    } catch {
      return { size: 0, duration: 0 }
    }
  }

  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  async notifyBackupFailure(error, environment) {
    const notification = {
      title: `🚨 Échec Backup ${environment}`,
      message: error.message,
      timestamp: new Date().toISOString(),
      environment
    }
    
    // Notification Slack si configuré
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const fetch = (await import('node-fetch')).default
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `${notification.title}\n${notification.message}`,
            channel: '#alerts'
          })
        })
      } catch (slackError) {
        console.error('Erreur notification Slack:', slackError)
      }
    }
    
    console.error('Notification échec backup:', notification)
  }

  // Méthode pour restaurer un backup
  async restoreBackup(backupPath, targetDatabaseUrl) {
    console.log(`🔄 Démarrage de la restauration: ${backupPath}`)
    
    try {
      // Vérifier que le fichier existe
      await fs.access(backupPath)
      
      // Déchiffrer si nécessaire
      if (this.encryption && backupPath.endsWith('.enc')) {
        await this.decryptBackup(backupPath)
      }
      
      // Décompresser si nécessaire
      if (backupPath.endsWith('.gz')) {
        await this.decompressBackup(backupPath)
      }
      
      // Restaurer avec pg_restore
      execSync(`pg_restore --verbose --clean --no-owner --no-privileges --dbname="${targetDatabaseUrl}" "${backupPath}"`, {
        stdio: 'inherit'
      })
      
      console.log(`✅ Restauration terminée avec succès`)
      
    } catch (error) {
      console.error(`❌ Erreur lors de la restauration:`, error)
      throw error
    }
  }
}

// CLI Interface
if (require.main === module) {
  const backupService = new DatabaseBackupService()
  
  const command = process.argv[2]
  const environment = process.argv[3] || 'production'
  
  switch (command) {
    case 'create':
    case 'backup':
      backupService.createBackup(environment)
        .then(result => {
          console.log('Backup réussi:', result)
          process.exit(0)
        })
        .catch(error => {
          console.error('Backup échoué:', error)
          process.exit(1)
        })
      break
      
    case 'restore':
      const backupPath = process.argv[4]
      const targetUrl = process.argv[5]
      
      if (!backupPath || !targetUrl) {
        console.error('Usage: node backup-database.js restore <environment> <backup-path> <target-database-url>')
        process.exit(1)
      }
      
      backupService.restoreBackup(backupPath, targetUrl)
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Restauration échouée:', error)
          process.exit(1)
        })
      break
      
    default:
      console.log(`
🗄️ Système de Backup PostgreSQL - Yesod CRM

Usage:
  node backup-database.js create [environment]     # Créer un backup
  node backup-database.js restore <env> <path> <url>  # Restaurer un backup

Environments: production, staging, development

Variables d'environnement:
  - BACKUP_DIR: Répertoire des backups (défaut: ./backups)
  - BACKUP_S3_BUCKET: Bucket S3 pour le stockage cloud
  - BACKUP_COMPRESSION: Activer compression (défaut: true)
  - BACKUP_ENCRYPT: Activer chiffrement (défaut: false)
  - BACKUP_ENCRYPTION_KEY: Clé de chiffrement
  - SLACK_WEBHOOK_URL: Webhook pour notifications

Exemples:
  npm run db:backup -- create production
  npm run db:backup -- restore staging ./backups/yesod-staging-daily-2024-01-15.sql
      `)
      process.exit(0)
  }
}

module.exports = { DatabaseBackupService }
