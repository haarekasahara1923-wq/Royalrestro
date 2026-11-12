'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

export default function MobileBackButtonHandler() {
  useEffect(() => {
    // Only run on native platforms (iOS/Android)
    if (!Capacitor.isNativePlatform()) return

    let isListenerActive = true
    let removeListener: (() => void) | null = null

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app')
        
        const listener = await App.addListener('backButton', (data) => {
          if (!isListenerActive) return
          
          if (data.canGoBack) {
            window.history.back()
          } else {
            App.exitApp()
          }
        })

        removeListener = () => {
          listener.remove()
        }
      } catch (err) {
        console.error('Failed to setup native back button listener:', err)
      }
    }

    setupBackButton()

    return () => {
      isListenerActive = false
      if (removeListener) {
        removeListener()
      }
    }
  }, [])

  return null
}
