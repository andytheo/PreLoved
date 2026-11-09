import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/verify-email') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token?.id) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }

  if (!pathname.startsWith('/listings') && !pathname.startsWith('/profile')) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/listings/:path*', '/profile/:path*', '/admin/:path*'],
}
