import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

interface InvoiceData {
  customerId: string
  customerName: string
  customerPhone: string
  clothingType: string
  subType: string
  otherClothing?: string
  quantity: number
  amount: number
}

export async function POST(request: Request) {
  try {
    const data: InvoiceData = await request.json()
    const { customerName, customerPhone, clothingType, subType, otherClothing, quantity, amount } = data
    const currentDate = new Date().toLocaleDateString()

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error('Missing Google service account credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
    })

    const authClient = await auth.getClient() as OAuth2Client
    const docs = google.docs({ version: 'v1', auth: authClient })
    const drive = google.drive({ version: 'v3', auth: authClient })

    const TEMPLATE_ID = process.env.NEXT_PUBLIC_TEMPLATE_ID
    if (!TEMPLATE_ID) {
      console.error('Missing template ID');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 1. Copy the template
    const copy = await drive.files.copy({
      fileId: TEMPLATE_ID,
      requestBody: {
        name: `Invoice-${customerName}-${Date.now()}`,
      },
    })

    if (!copy.data.id) {
      throw new Error('Failed to copy template');
    }

    const copyId = copy.data.id

    // 2. Replace placeholders
    const itemText = clothingType === 'other' ? otherClothing : `${clothingType} (${subType})`
    const replacements = {
      '{{Date}}': currentDate,
      '{{CustomerName}}': customerName,
      '{{CustomerNumber}}': customerPhone,
      '{{Item}}': itemText,
      '{{Quantity}}': quantity.toString(),
      '{{Amount}}': amount.toString(),
    }

    const requests = Object.entries(replacements).map(([key, value]) => ({
      replaceAllText: {
        containsText: { text: key, matchCase: true },
        replaceText: value,
      },
    }))

    await docs.documents.batchUpdate({
      documentId: copyId,
      requestBody: { requests },
    })

    // 3. Export as PDF
    const pdfExport = await drive.files.export(
      { fileId: copyId, mimeType: 'application/pdf' },
      { responseType: 'stream' }
    )

    // 4. Upload PDF to Drive
    const pdfUpload = await drive.files.create({
      requestBody: {
        name: `Invoice-${customerName}.pdf`,
        mimeType: 'application/pdf',
        parents: [process.env.NEXT_PUBLIC_FOLDER_ID!],
      },
      media: {
        mimeType: 'application/pdf',
        body: pdfExport.data,
      },
    })

    if (!pdfUpload.data.id) {
      throw new Error('Failed to upload PDF');
    }

    const fileId = pdfUpload.data.id

    // 5. Make the file publicly accessible
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // 6. Get shareable link
    const fileMeta = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
    })

    return NextResponse.json({ pdfUrl: fileMeta.data.webViewLink })
  } catch (err) {
    console.error('Error generating invoice:', err)
    return NextResponse.json(
      { error: 'Failed to generate invoice', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 