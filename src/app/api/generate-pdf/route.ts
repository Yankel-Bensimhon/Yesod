import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595, 842]) // A4 size
    
    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    let yPosition = height - 50
    
    // Header - Cabinet info
    page.drawText('YESOD', {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0.4, 0.8),
    })
    
    yPosition -= 25
    page.drawText('Cabinet d\'Avocats d\'Affaires', {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    
    yPosition -= 15
    page.drawText('Spécialisé en Recouvrement de Créances', {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    
    // Date
    yPosition -= 40
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    page.drawText(`Le ${currentDate}`, {
      x: width - 200,
      y: yPosition,
      size: 11,
      font: font,
    })
    
    // Creditor info
    yPosition -= 40
    page.drawText('CRÉANCIER :', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    })
    
    yPosition -= 20
    if (data.creditorName) {
      page.drawText(data.creditorName, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
      })
      yPosition -= 15
    }
    
    if (data.creditorAddress) {
      const addressLines = data.creditorAddress.split('\n')
      for (const line of addressLines) {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 11,
          font: font,
        })
        yPosition -= 15
      }
    }
    
    if (data.creditorPhone) {
      page.drawText(`Tél : ${data.creditorPhone}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
      })
      yPosition -= 15
    }
    
    if (data.creditorEmail) {
      page.drawText(`Email : ${data.creditorEmail}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
      })
      yPosition -= 15
    }
    
    // Debtor info
    yPosition -= 30
    page.drawText('DÉBITEUR :', {
      x: 300,
      y: yPosition,
      size: 12,
      font: boldFont,
    })
    
    yPosition -= 20
    if (data.debtorName) {
      page.drawText(data.debtorName, {
        x: 300,
        y: yPosition,
        size: 11,
        font: font,
      })
      yPosition -= 15
    }
    
    if (data.debtorAddress) {
      const addressLines = data.debtorAddress.split('\n')
      for (const line of addressLines) {
        page.drawText(line, {
          x: 300,
          y: yPosition,
          size: 11,
          font: font,
        })
        yPosition -= 15
      }
    }
    
    // Title
    yPosition -= 50
    page.drawText('MISE EN DEMEURE DE PAYER', {
      x: (width - 300) / 2,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0.8, 0, 0),
    })
    
    // Content
    yPosition -= 40
    const content = [
      'Monsieur, Madame,',
      '',
      `Par la présente, nous vous mettons en demeure de bien vouloir régler la somme de ${formatCurrency(parseFloat(data.amount || '0'), data.currency)} correspondant à :`,
      '',
      `- Facture n° ${data.invoiceNumber || 'N/A'}`,
    ]
    
    if (data.invoiceDate) {
      content.push(`- Date de facturation : ${formatDate(data.invoiceDate)}`)
    }
    
    if (data.dueDate) {
      content.push(`- Date d'échéance : ${formatDate(data.dueDate)}`)
    }
    
    if (data.description) {
      content.push(`- Objet : ${data.description}`)
    }
    
    content.push(
      '',
      'Cette créance demeure impayée à ce jour malgré nos relances précédentes.',
      '',
      'En conséquence, nous vous demandons de bien vouloir procéder au règlement de cette somme dans un délai de HUIT (8) JOURS à compter de la réception de la présente mise en demeure.',
      '',
      'À défaut de règlement dans ce délai, nous nous réserverons le droit d\'engager contre vous toute action en recouvrement que nous jugerons utile, y compris par voie judiciaire, et ce à vos frais, risques et périls.',
      '',
      'Nous vous rappelons qu\'aux termes de l\'article 1231-6 du Code civil, le débiteur est de plein droit constitué en demeure par la seule exigibilité de l\'obligation, lorsque celle-ci résulte d\'un écrit.',
      '',
      'Dans l\'espoir que vous voudrez bien régulariser cette situation dans les meilleurs délais, nous vous prions d\'agréer, Monsieur, Madame, l\'expression de nos salutations distinguées.',
      '',
      '',
      'Cabinet YESOD',
      'Avocat au Barreau'
    )
    
    for (const line of content) {
      if (yPosition < 100) {
        // Add new page if needed
        page = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }
      
      // Clean the text to remove characters that can't be encoded in WinAnsi
      const cleanLine = line.replace(/[\u00A0\u202F\u2007\u2009\u200A]/g, ' ').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
      
      page.drawText(cleanLine, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
        maxWidth: width - 100,
      })
      yPosition -= 18
    }
    
    // Generate PDF
    const pdfBytes = await pdfDoc.save()
    
    // If email option is selected, you would send email here
    // For now, just return the PDF
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="mise-en-demeure-${data.debtorName?.replace(/\s+/g, '-') || 'document'}.pdf"`,
      },
    })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}