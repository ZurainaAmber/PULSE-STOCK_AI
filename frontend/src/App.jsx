import React, { useState, useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './components/auth/LoginPage'
import { getStoredUser, fetchCurrentUser, logout } from './services/authService'

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser())
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function initAuth() {
      try {
        const user = await fetchCurrentUser()
        if (user) {
          setCurrentUser(user)
        }
      } catch (err) {
        console.warn('Auth check on startup:', err)
      } finally {
        setIsInitializing(false)
      }
    }
    initAuth()
  }, [])

  const handleLogout = async () => {
    await logout()
    setCurrentUser(null)
  }

  const handleSwitchManager = () => {
    setCurrentUser(null)
  }

  if (isInitializing && !currentUser) {
    return (
      <div className="min-h-screen bg-[#04201e] flex items-center justify-center text-emerald-400 font-mono text-sm">
        Initializing PulseStock AI Security Context...
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />
  }

  return (
    <AppShell
      initialTab="manager"
      currentUser={currentUser}
      onLogout={handleLogout}
      onSwitchManager={handleSwitchManager}
    />
  )
}
