import { NextRequest, NextResponse } from 'next/server'
import { generateMenuQR } from '@/lib/qr'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // We can generate it using the lib helper which uses 'qrcode'
    const qrDataUrl = await generateMenuQR(url)
    return NextResponse.json({ qrDataUrl })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
