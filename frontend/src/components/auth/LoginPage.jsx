import React, { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  User,
  Store,
  ArrowRight,
  AlertCircle,
  Boxes,
  CheckCircle2,
  KeyRound
} from 'lucide-react'
import { login } from '../../services/authService'

export function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('mgr_store7')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(null)
  const [error, setError] = useState(null)

  const handleLogin = async (u = username, p = password) => {
    setIsLoading(true)
    setLoadingUser(u)
    setError(null)
    try {
      const res = await login(u, p)
      if (res?.user) {
        onLoginSuccess(res.user)
      } else {
        throw new Error('Authentication succeeded but user profile was not returned.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
      setLoadingUser(null)
    }
  }

  const handleQuickDemoLogin = (uname) => {
    setUsername(uname)
    setPassword('password123')
    handleLogin(uname, 'password123')
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] text-slate-900 flex flex-col justify-center items-center py-10 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#04201e] text-emerald-400 shadow-md mb-1 border border-teal-800/40">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              PulseStock <span className="text-teal-700 font-bold">AI</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Enterprise Dark Store Inventory & Transfer Platform
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
          
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Manager Sign-In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authenticate to manage dark store inventory & inter-store transfers.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Login Failed:</span> {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manager Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. mgr_store7"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700 font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && !loadingUser ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>One-Click Demo Manager Accounts</span>
              <span className="text-teal-700 font-mono lowercase">pwd: password123</span>
            </div>

            <div className="space-y-2">
              {/* Store 7 */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('mgr_store7')}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl border border-teal-200/90 hover:border-teal-400 bg-teal-50/40 hover:bg-teal-50/80 flex items-center justify-between transition-colors cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    M7
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                      Store 7 — Koramangala Tech Park
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      mgr_store7 (Stockout / Requester Store)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-800 shrink-0">
                  <span>{isLoading && loadingUser === 'mgr_store7' ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Store 3 */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('mgr_store3')}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between transition-colors cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    M3
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                      Store 3 — Domlur Hub
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      mgr_store3 (Primary Donor Store)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-800 shrink-0">
                  <span>{isLoading && loadingUser === 'mgr_store3' ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Store 12 */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('mgr_store12')}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between transition-colors cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    M12
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                      Store 12 — Marathahalli Bridge
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      mgr_store12 (Secondary Donor Store)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-800 shrink-0">
                  <span>{isLoading && loadingUser === 'mgr_store12' ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
          <span>PBKDF2-HMAC-SHA256 Server Hashing • SQLite Session Persistence</span>
        </div>

      </div>
    </div>
  )
}
