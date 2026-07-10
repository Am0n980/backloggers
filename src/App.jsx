import { useState } from 'react'
import { supabase } from './supabaseClient'
import SignUp from './pages/SignUp'

export default function App() {
  const [theme, setTheme] = useState('dark')

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <SignUp theme={theme} onToggleTheme={toggleTheme} />
  )
}