import { useState } from 'react'
import { supabase } from '../supabaseClient'
import ThemeToggle from '../components/ThemeToggle'
import { useNavigate } from 'react-router-dom'

const GENRES = [
  'RPG', 'Adventure', 'Action', 'Strategy', 'Horror',
  'Puzzle', 'Fighting', 'Simulation', 'Platformer', 'JRPG'
]

const PLATFORMS = [
  'Steam', 'Ubisoft Connect', 'Epic Games', 'GOG',
  'Amazon Games', 'PlayStation', 'Xbox', 'Nintendo', 'Retro'
]

export default function Onboarding({ theme, onToggleTheme }) {
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  function toggleItem(item, list, setList) {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('users')
      .update({
        preferred_genres: selectedGenres,
        preferred_platforms: selectedPlatforms
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      navigate('/home')
    }

    setLoading(false)
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <div className="max-w-lg w-full mx-auto px-4 py-12">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium mb-1">Set up your preferences</h1>
          <p className="text-gray-400 text-sm">Pick your favourite genres and platforms to personalise your feed</p>
        </div>

        <div className={`rounded-xl border p-6 mb-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

          <h2 className="text-sm font-medium text-gray-400 mb-3">Favourite genres</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => toggleItem(genre, selectedGenres, setSelectedGenres)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selectedGenres.includes(genre)
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <h2 className="text-sm font-medium text-gray-400 mb-3">Platforms you own</h2>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(platform => (
              <button
                key={platform}
                onClick={() => toggleItem(platform, selectedPlatforms, setSelectedPlatforms)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selectedPlatforms.includes(platform)
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>

        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || (selectedGenres.length === 0 && selectedPlatforms.length === 0)}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>

        <p className="text-center text-xs text-gray-500 mt-3">You can change these later in Settings</p>

      </div>
    </div>
  )
}