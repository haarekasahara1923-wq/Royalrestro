import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadDishImage } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Updated limit to 50MB as requested
    const MAX_SIZE = 50 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: 'File size too large', 
        details: 'The image exceeds the 50MB limit. Please compress the image or upload a smaller file.' 
      }, { status: 400 })
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary
    try {
      const result = await uploadDishImage(buffer, file.name || 'dish')
      return NextResponse.json({ url: result.url, publicId: result.publicId })
    } catch (uploadError: any) {
      console.error('Cloudinary Upload Error Details:', uploadError)
      return NextResponse.json({ 
        error: 'Cloudinary upload failed', 
        details: uploadError.message || uploadError 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('API Route Error:', error)
    return NextResponse.json({ error: 'Failed to process upload', details: error.message }, { status: 500 })
  }
}
