import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import EmailConfirmation from './pages/EmailConfirmation'
import Onboarding from './pages/Onboarding'

export default function App() {
  const [theme, setTheme] = useState('dark')

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignUp theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/signin" element={<SignIn theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/confirm" element={<EmailConfirmation theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/onboarding" element={<Onboarding theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="*" element={<Navigate to="/signup" />} />
      </Routes>
    </BrowserRouter>
  )
}
  