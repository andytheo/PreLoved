import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createHash } from 'crypto'
import { authOptions } from '@/lib/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024
const MAX_FILES = 6

function hasSupportedSignature(bytes: Uint8Array) {
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  return isJpeg || isPng || isWebp
}

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Image storage is not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'preloved/listings'
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = createHash('sha1').update(signatureBase).digest('hex')

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', apiKey)
  form.append('timestamp', timestamp.toString())
  form.append('folder', folder)
  form.append('signature', signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error('Cloud image upload failed')
  }

  const result = (await response.json()) as { secure_url?: string }
  if (!result.secure_url) throw new Error('Cloud image upload returned no URL')

  // Serve an automatically compressed, format-optimized image capped at a sensible display width.
  return result.secure_url.replace('/upload/', '/upload/f_auto,q_auto,c_limit,w_1600/')
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files').filter((value): value is File => value instanceof File)

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Too many files (max ${MAX_FILES})` }, { status: 400 })
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 })
      }
      if (file.size <= 0 || file.size > MAX_SIZE) {
        return NextResponse.json({ error: `Each image must be 5MB or smaller: ${file.name}` }, { status: 400 })
      }

      const header = new Uint8Array((await file.slice(0, 16).arrayBuffer()))
      if (!hasSupportedSignature(header)) {
        return NextResponse.json({ error: `File content does not match a supported image format: ${file.name}` }, { status: 400 })
      }
    }

    const urls = await Promise.all(files.map(uploadToCloudinary))
    return NextResponse.json({ urls }, { status: 201 })
  } catch (error) {
    console.error('Upload failed', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
