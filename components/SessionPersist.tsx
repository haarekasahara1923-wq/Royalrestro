'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function SessionPersist() {
  const pathname = usePathname()

  useEffect(() => {
    const cookieNames = [
      '__Secure-authjs.session-token',
      'authjs.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.session-token'
    ]
    const storageCookieNameKey = 'cached_session_cookie_name'
    const storageCookieValKey = 'cached_session_cookie_val'
    const isProd = window.location.protocol === 'https:'

    // Helper to get cookie value by name
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    // Helper to set cookie
    const setCookie = (name: string, value: string, days: number) => {
      let expires = ""
      if (days) {
        const date = new Date()
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
        expires = "; expires=" + date.toUTCString()
      }
      document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax${isProd ? '; Secure' : ''}`
    }

    // Check if we have any active next-auth cookie in document.cookie
    let activeCookieName = null
    let activeCookieValue = null

    for (const name of cookieNames) {
      const val = getCookie(name)
      if (val) {
        activeCookieName = name
        activeCookieValue = val
        break
      }
    }

    const isLoginPage = pathname?.startsWith('/auth/login')

    if (isLoginPage) {
      // If we are on the login page:
      // We check if we already attempted to restore the session in this window session
      const restoreAttempted = sessionStorage.getItem('restore_attempted')

      if (!restoreAttempted) {
        // If we haven't attempted to restore yet (e.g. app just loaded and redirected here),
        // we check if we have a stashed token in localStorage.
        const cachedName = localStorage.getItem(storageCookieNameKey)
        const cachedVal = localStorage.getItem(storageCookieValKey)
        if (cachedName && cachedVal) {
          // Mark restore as attempted in sessionStorage
          sessionStorage.setItem('restore_attempted', 'true')
          // Restore the cookie
          setCookie(cachedName, cachedVal, 30) // 30 days
          
          // Reload to let NextAuth recognize the restored cookie
          window.location.reload()
          return
        }
      } else {
        // If we already attempted to restore and still ended up on login, or if this is an explicit logout,
        // we clear the cache so the user can log in with a clean state.
        localStorage.removeItem(storageCookieNameKey)
        localStorage.removeItem(storageCookieValKey)
        sessionStorage.removeItem('restore_attempted')
      }
    } else {
      // If we are on any page other than login (meaning user is logged in):
      if (activeCookieName && activeCookieValue) {
        // Cookie exists, stash/update it in localStorage
        localStorage.setItem(storageCookieNameKey, activeCookieName)
        localStorage.setItem(storageCookieValKey, activeCookieValue)
        // Mark restore as attempted/valid since we are active
        sessionStorage.setItem('restore_attempted', 'true')
      }
    }
  }, [pathname])

  return null
}
