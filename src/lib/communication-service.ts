// =====================================
// PHASE 2 - COMMUNICATION OMNICANALE
// =====================================

import { prisma } from './prisma'

// Types pour la communication
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
  category: 'reminder' | 'notice' | 'confirmation' | 'custom'
  isActive: boolean
}

export interface SMSTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  maxLength: number
  isActive: boolean
}

export interface CommunicationLog {
  id: string
  type: 'email' | 'sms' | 'phone' | 'letter'
  direction: 'outbound' | 'inbound'
  status: 'sent' | 'delivered' | 'failed' | 'bounced'
  recipient: string
  content: string
  metadata: Record<string, any>
  sentAt: Date
  deliveredAt?: Date
  caseId?: string
  clientId: string
}

// =====================================
// SERVICE EMAIL PROFESSIONNEL
// =====================================

class EmailServiceImpl {
  
  // Templates juridiques pré-configurés
  static getDefaultTemplates(): EmailTemplate[] {
    return [
      {
        id: 'first_reminder',
        name: 'Premier rappel amiable',
        subject: 'Rappel de paiement - Facture {{invoiceNumber}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #1f2937;">{{creditorName}}</h2>
              <hr style="border: 1px solid #e5e7eb;">
              
              <p>Madame, Monsieur,</p>
              
              <p>Nous vous rappelons qu'à ce jour, notre facture n° <strong>{{invoiceNumber}}</strong> 
                 d'un montant de <strong>{{amount}} €</strong> datée du <strong>{{invoiceDate}}</strong> 
                 demeure impayée.</p>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Date d'échéance dépassée :</strong> {{dueDate}}
                </p>
              </div>
              
              <p>Nous vous prions de bien vouloir régulariser cette situation dans les 
                 <strong>8 jours</strong> suivant la réception de ce courrier.</p>
              
              <p>En cas de difficultés, nous vous invitons à nous contacter rapidement 
                 afin d'étudier ensemble une solution de règlement.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  Cordialement,<br>
                  {{creditorName}}<br>
                  {{creditorEmail}} | {{creditorPhone}}
                </p>
              </div>
            </div>
          </div>
        `,
        textContent: `
Madame, Monsieur,

Nous vous rappelons qu'à ce jour, notre facture n° {{invoiceNumber}} d'un montant de {{amount}} € datée du {{invoiceDate}} demeure impayée.

Date d'échéance dépassée : {{dueDate}}

Nous vous prions de bien vouloir régulariser cette situation dans les 8 jours suivant la réception de ce courrier.

En cas de difficultés, nous vous invitons à nous contacter rapidement afin d'étudier ensemble une solution de règlement.

Cordialement,
{{creditorName}}
{{creditorEmail}} | {{creditorPhone}}
        `,
        variables: ['creditorName', 'invoiceNumber', 'amount', 'invoiceDate', 'dueDate', 'creditorEmail', 'creditorPhone'],
        category: 'reminder',
        isActive: true
      },
      {
        id: 'urgent_reminder',
        name: 'Rappel urgent avant mise en demeure',
        subject: '🚨 URGENT - Dernière relance avant mise en demeure - {{invoiceNumber}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fef2f2; border: 2px solid #fca5a5; padding: 20px; border-radius: 8px;">
              <h2 style="color: #dc2626;">⚠️ DERNIÈRE RELANCE</h2>
              <h3 style="color: #1f2937;">{{creditorName}}</h3>
              <hr style="border: 1px solid #e5e7eb;">
              
              <p><strong>Madame, Monsieur,</strong></p>
              
              <div style="background: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #dc2626; font-weight: bold;">
                  Cette correspondance constitue notre DERNIÈRE RELANCE AMIABLE
                </p>
              </div>
              
              <p>Malgré nos précédents courriers, votre facture n° <strong>{{invoiceNumber}}</strong> 
                 d'un montant de <strong>{{amount}} €</strong> demeure à ce jour impayée.</p>
              
              <div style="background: #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Échue depuis :</strong> {{daysOverdue}} jours<br>
                  <strong>Montant dû :</strong> {{amount}} € + intérêts de retard
                </p>
              </div>
              
              <p><strong>Vous disposez d'un délai de 48 HEURES</strong> pour régulariser votre situation.</p>
              
              <p>Passé ce délai, nous serons contraints d'engager une procédure de mise en demeure 
                 puis de recouvrement judiciaire, avec tous les frais et pénalités que cela implique.</p>
              
              <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Contact urgence :</strong> {{creditorPhone}}<br>
                  <strong>Email :</strong> {{creditorEmail}}
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  {{creditorName}}<br>
                  Cabinet de recouvrement juridique
                </p>
              </div>
            </div>
          </div>
        `,
        textContent: `
⚠️ DERNIÈRE RELANCE - {{creditorName}}

Madame, Monsieur,

Cette correspondance constitue notre DERNIÈRE RELANCE AMIABLE.

Malgré nos précédents courriers, votre facture n° {{invoiceNumber}} d'un montant de {{amount}} € demeure à ce jour impayée.

Échue depuis : {{daysOverdue}} jours
Montant dû : {{amount}} € + intérêts de retard

Vous disposez d'un délai de 48 HEURES pour régulariser votre situation.

Passé ce délai, nous serons contraints d'engager une procédure de mise en demeure puis de recouvrement judiciaire.

Contact urgence : {{creditorPhone}}
Email : {{creditorEmail}}

{{creditorName}}
Cabinet de recouvrement juridique
        `,
        variables: ['creditorName', 'invoiceNumber', 'amount', 'daysOverdue', 'creditorPhone', 'creditorEmail'],
        category: 'notice',
        isActive: true
      },
      {
        id: 'payment_confirmation',
        name: 'Confirmation de paiement',
        subject: '✅ Confirmation de règlement - {{invoiceNumber}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px;">
              <h2 style="color: #15803d;">✅ Paiement confirmé</h2>
              <h3 style="color: #1f2937;">{{creditorName}}</h3>
              <hr style="border: 1px solid #e5e7eb;">
              
              <p>Madame, Monsieur,</p>
              
              <p>Nous accusons réception de votre règlement concernant la facture n° <strong>{{invoiceNumber}}</strong> 
                 d'un montant de <strong>{{amount}} €</strong>.</p>
              
              <div style="background: #dcfce7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #15803d;">
                  <strong>Paiement reçu le :</strong> {{paymentDate}}<br>
                  <strong>Montant :</strong> {{amount}} €<br>
                  <strong>Référence :</strong> {{paymentReference}}
                </p>
              </div>
              
              <p>Votre dossier est désormais soldé. Nous vous remercions pour votre règlement.</p>
              
              <p>Si vous avez des questions concernant cette transaction, n'hésitez pas à nous contacter.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  Cordialement,<br>
                  {{creditorName}}<br>
                  {{creditorEmail}} | {{creditorPhone}}
                </p>
              </div>
            </div>
          </div>
        `,
        textContent: `
✅ Paiement confirmé - {{creditorName}}

Madame, Monsieur,

Nous accusons réception de votre règlement concernant la facture n° {{invoiceNumber}} d'un montant de {{amount}} €.

Paiement reçu le : {{paymentDate}}
Montant : {{amount}} €
Référence : {{paymentReference}}

Votre dossier est désormais soldé. Nous vous remercions pour votre règlement.

Cordialement,
{{creditorName}}
{{creditorEmail}} | {{creditorPhone}}
        `,
        variables: ['creditorName', 'invoiceNumber', 'amount', 'paymentDate', 'paymentReference', 'creditorEmail', 'creditorPhone'],
        category: 'confirmation',
        isActive: true
      }
    ]
  }

  // Envoi d'email avec template
  static async sendTemplatedEmail(
    recipientEmail: string,
    templateId: string,
    variables: Record<string, string>,
    caseId?: string,
    clientId?: string
  ): Promise<CommunicationLog> {
    try {
      const templates = EmailServiceImpl.getDefaultTemplates()
      const template = templates.find((t: EmailTemplate) => t.id === templateId)
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`)
      }

      // Remplacement des variables
      let subject = template.subject
      let htmlContent = template.htmlContent
      let textContent = template.textContent

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        subject = subject.replace(new RegExp(placeholder, 'g'), value)
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value)
        textContent = textContent.replace(new RegExp(placeholder, 'g'), value)
      })

      // Simulation d'envoi (en production, utiliser SendGrid, Mailgun, etc.)
      console.log(`Sending email to ${recipientEmail}`)
      console.log(`Subject: ${subject}`)
      
      // Log de communication
      const communicationLog: CommunicationLog = {
        id: `email_${Date.now()}`,
        type: 'email',
        direction: 'outbound',
        status: 'sent',
        recipient: recipientEmail,
        content: JSON.stringify({ subject, htmlContent, textContent }),
        metadata: {
          templateId,
          variables,
          sentAt: new Date().toISOString()
        },
        sentAt: new Date(),
        caseId,
        clientId: clientId || ''
      }

      // En production, sauvegarder en base
      console.log('Email sent successfully:', communicationLog.id)

      return communicationLog
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  // Tracking d'ouverture et de clics
  static async trackEmailInteraction(emailId: string, action: 'opened' | 'clicked', url?: string) {
    console.log(`Email ${emailId} ${action}${url ? ` - URL: ${url}` : ''}`)
    
    // En production, mettre à jour les statistiques en base
    // await prisma.communicationLog.update({
    //   where: { id: emailId },
    //   data: { 
    //     metadata: { 
    //       ...metadata, 
    //       [action]: new Date(),
    //       clickedUrl: url 
    //     }
    //   }
    // })
  }
}

// =====================================
// SERVICE SMS PROFESSIONNEL
// =====================================

class SMSServiceImpl {
  
  // Templates SMS juridiques
  static getDefaultSMSTemplates(): SMSTemplate[] {
    return [
      {
        id: 'urgent_sms',
        name: 'SMS rappel urgent',
        content: '🚨 URGENT {{creditorName}}: Facture {{invoiceNumber}} ({{amount}}€) échue depuis {{daysOverdue}} jours. Appelez-nous: {{phone}}',
        variables: ['creditorName', 'invoiceNumber', 'amount', 'daysOverdue', 'phone'],
        maxLength: 160,
        isActive: true
      },
      {
        id: 'payment_reminder_sms',
        name: 'SMS rappel paiement',
        content: '{{creditorName}}: Facture {{invoiceNumber}} de {{amount}}€ échue. Merci de régulariser. Contact: {{phone}}',
        variables: ['creditorName', 'invoiceNumber', 'amount', 'phone'],
        maxLength: 160,
        isActive: true
      },
      {
        id: 'appointment_reminder_sms',
        name: 'SMS rappel RDV',
        content: 'Rappel RDV {{date}} à {{time}} - {{location}}. {{creditorName}} - Annulation: {{phone}}',
        variables: ['date', 'time', 'location', 'creditorName', 'phone'],
        maxLength: 160,
        isActive: true
      }
    ]
  }

  // Envoi de SMS avec template
  static async sendTemplatedSMS(
    recipientPhone: string,
    templateId: string,
    variables: Record<string, string>,
    caseId?: string,
    clientId?: string
  ): Promise<CommunicationLog> {
    try {
      const templates = SMSServiceImpl.getDefaultSMSTemplates()
      const template = templates.find((t: SMSTemplate) => t.id === templateId)
      
      if (!template) {
        throw new Error(`SMS Template ${templateId} not found`)
      }

      // Remplacement des variables
      let content = template.content
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        content = content.replace(new RegExp(placeholder, 'g'), value)
      })

      // Vérification de la longueur
      if (content.length > template.maxLength) {
        console.warn(`SMS content exceeds max length: ${content.length}/${template.maxLength}`)
      }

      // Simulation d'envoi (en production, utiliser Twilio, etc.)
      console.log(`Sending SMS to ${recipientPhone}`)
      console.log(`Content: ${content}`)
      
      // Log de communication
      const communicationLog: CommunicationLog = {
        id: `sms_${Date.now()}`,
        type: 'sms',
        direction: 'outbound',
        status: 'sent',
        recipient: recipientPhone,
        content,
        metadata: {
          templateId,
          variables,
          length: content.length,
          sentAt: new Date().toISOString()
        },
        sentAt: new Date(),
        caseId,
        clientId: clientId || ''
      }

      console.log('SMS sent successfully:', communicationLog.id)

      return communicationLog
    } catch (error) {
      console.error('Error sending SMS:', error)
      throw error
    }
  }

  // Validation du numéro de téléphone
  static validatePhoneNumber(phone: string): boolean {
    // Validation basique pour numéros français
    const frenchPhoneRegex = /^(\+33|0)[1-9](\d{8})$/
    return frenchPhoneRegex.test(phone.replace(/\s/g, ''))
  }
}

// =====================================
// GESTIONNAIRE DE COMMUNICATION GLOBALE
// =====================================

class CommunicationManagerImpl {
  
  // Envoi de communication automatique basée sur des règles
  static async sendAutomatedCommunication(
    caseId: string,
    trigger: 'overdue_1d' | 'overdue_7d' | 'overdue_15d' | 'payment_received'
  ) {
    try {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: { client: true }
      })

      if (!caseData) {
        throw new Error('Case not found')
      }

      const variables = {
        creditorName: 'Cabinet Bensimhon',
        creditorEmail: 'contact@yesod-recouvrement.fr',
        creditorPhone: '01 45 67 89 00',
        invoiceNumber: caseData.title || 'N/A',
        amount: caseData.amount?.toString() || '0',
        invoiceDate: caseData.createdAt.toLocaleDateString('fr-FR'),
        dueDate: caseData.dueDate?.toLocaleDateString('fr-FR') || 'N/A',
        daysOverdue: caseData.dueDate ? 
          Math.floor((Date.now() - caseData.dueDate.getTime()) / (1000 * 60 * 60 * 24)).toString() : '0',
        clientName: caseData.client?.name || 'N/A',
        paymentDate: new Date().toLocaleDateString('fr-FR'),
        paymentReference: `PAY_${Date.now()}`
      }

      let emailTemplate: string
      let smsTemplate: string | null = null

      switch (trigger) {
        case 'overdue_1d':
          emailTemplate = 'first_reminder'
          break
        case 'overdue_7d':
          emailTemplate = 'urgent_reminder'
          smsTemplate = 'urgent_sms'
          break
        case 'overdue_15d':
          emailTemplate = 'urgent_reminder'
          smsTemplate = 'urgent_sms'
          break
        case 'payment_received':
          emailTemplate = 'payment_confirmation'
          break
        default:
          throw new Error(`Unknown trigger: ${trigger}`)
      }

      const communications: CommunicationLog[] = []

      // Envoi email
      if (caseData.client?.email) {
        const emailLog = await EmailServiceImpl.sendTemplatedEmail(
          caseData.client.email,
          emailTemplate,
          variables,
          caseId,
          caseData.client.id
        )
        communications.push(emailLog)
      }

      // Envoi SMS si applicable
      if (smsTemplate && caseData.client?.phone) {
        const smsLog = await SMSServiceImpl.sendTemplatedSMS(
          caseData.client.phone,
          smsTemplate,
          variables,
          caseId,
          caseData.client.id
        )
        communications.push(smsLog)
      }

      return communications
    } catch (error) {
      console.error('Error sending automated communication:', error)
      throw error
    }
  }

  // Historique de communication pour un dossier
  static async getCommunicationHistory(caseId: string): Promise<CommunicationLog[]> {
    // En production, récupérer depuis la base
    // return await prisma.communicationLog.findMany({
    //   where: { caseId },
    //   orderBy: { sentAt: 'desc' }
    // })
    
    // Simulation
    return [
      {
        id: 'comm_1',
        type: 'email',
        direction: 'outbound',
        status: 'delivered',
        recipient: 'client@example.com',
        content: 'Premier rappel envoyé',
        metadata: { templateId: 'first_reminder' },
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5000),
        caseId,
        clientId: 'client_1'
      }
    ]
  }

  // Statistiques de communication
  static async getCommunicationStats(): Promise<{
    totalSent: number
    emailsDelivered: number
    smsDelivered: number
    bounceRate: number
    responseRate: number
  }> {
    // En production, calculer depuis la base
    return {
      totalSent: 1247,
      emailsDelivered: 1156,
      smsDelivered: 891,
      bounceRate: 7.3,
      responseRate: 23.8
    }
  }
}

// Exports
export const EmailService = EmailServiceImpl
export const SMSService = SMSServiceImpl
export const CommunicationManager = CommunicationManagerImpl
