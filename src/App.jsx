import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'

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
        <Route path="*" element={<Navigate to="/signup" />} />
      </Routes>
    </BrowserRouter>
  )
}