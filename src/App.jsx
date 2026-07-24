import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import EmailConfirmation from './pages/EmailConfirmation'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Library from './pages/Library'
import Lists from './pages/Lists'
import ListDetail from './pages/ListDetail'
import Profile from './pages/Profile'

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={!session ? <SignUp theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/home" />} />
        <Route path="/signin" element={!session ? <SignIn theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/home" />} />
        <Route path="/confirm" element={<EmailConfirmation theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/onboarding" element={session ? <Onboarding theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/signin" />} />
        <Route path="/home" element={session ? <Home theme={theme} /> : <Navigate to="/signin" />} />
        <Route path="/library" element={session ? <Library theme={theme} /> : <Navigate to="/signin" />} />
        <Route path="/lists" element={session ? <Lists theme={theme} /> : <Navigate to="/signin" />} />
        <Route path="/list/:id" element={session ? <ListDetail theme={theme} /> : <Navigate to="/signin" />} />
        <Route path="/profile/:username" element={session ? <Profile theme={theme} /> : <Navigate to="/signin" />} />
        <Route path="/profile" element={session ? <ProfileRedirect /> : <Navigate to="/signin" />} />
        <Route path="*" element={<Navigate to={session ? "/home" : "/signup"} />} />
      </Routes>
    </BrowserRouter>
  )
}

function ProfileRedirect() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase.from('users').select('username').eq('id', user.id).single().then(({ data }) => {
        if (data) navigate(`/profile/${data.username}`, { replace: true })
        setLoading(false)
      })
    })
  }, [])

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-gray-400 text-sm">Loading...</p></div>
  return null
}