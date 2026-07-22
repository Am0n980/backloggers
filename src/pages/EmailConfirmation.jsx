import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ThemeToggle from '../components/ThemeToggle'

export default function EmailConfirmation({ theme, onToggleTheme }) {
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStatus('success')
      }
    })

    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const tokenHash = new URLSearchParams(window.location.search).get('token_hash')
    const type = new URLSearchParams(window.location.search).get('type')

    if (tokenHash && type) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
        }
      })
    } else if (hashParams.get('access_token')) {
      setStatus('success')
    } else {
      setStatus('error')
    }
  }, [])

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <div className="max-w-md w-full mx-auto px-4 text-center">

        {status === 'verifying' && (
          <div>
            <h1 className="text-2xl font-medium mb-2">Verifying your email...</h1>
            <p className="text-gray-400 text-sm">Just a moment</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <h1 className="text-2xl font-medium mb-2">Email confirmed</h1>
            <p className="text-gray-400 text-sm mb-6">Your account is active. Let's set up your preferences.</p>
            <a href="/onboarding" className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors">Get started</a>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h1 className="text-2xl font-medium mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">The confirmation link may have expired. Try signing up again.</p>
            <a href="/signup" className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors">Back to sign up</a>
          </div>
        )}

      </div>
    </div>
  )
}