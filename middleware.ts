import NextAuth from "next-auth"
import { authConfig } from "./lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const role = (req.auth?.user as any)?.role

  if (pathname.startsWith('/admin') && role !== 'admin')
    return NextResponse.redirect(new URL('/auth/login', req.url))

  if (pathname.startsWith('/reception') && !['admin', 'reception'].includes(role))
    return NextResponse.redirect(new URL('/auth/login', req.url))

  if (pathname.startsWith('/kitchen') && !['admin', 'kitchen'].includes(role))
    return NextResponse.redirect(new URL('/auth/login', req.url))
})

export const config = {
  matcher: ['/admin/:path*', '/reception/:path*', '/kitchen/:path*'],
}
