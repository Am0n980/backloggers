import { useState } from 'react'
import { supabase } from '../supabaseClient'
import ThemeToggle from '../components/ThemeToggle'

export default function SignUp({ theme, onToggleTheme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSignUp(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <h1 className="text-2xl font-medium mb-4">Check your email</h1>
          <p className="text-gray-400">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <div className="max-w-md w-full mx-auto px-4">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm">Start managing your game backlog</p>
        </div>

        <div className={`rounded-xl border p-6 mb-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <form onSubmit={handleSignUp}>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/signin" className="text-blue-400 hover:text-blue-300">Sign in</a>
        </p>

      </div>
    </div>
  )
}