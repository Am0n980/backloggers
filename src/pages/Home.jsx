import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Home({ theme }) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedMode, setFeedMode] = useState('foryou')
  const [userPrefs, setUserPrefs] = useState({ genres: [], platforms: [] })
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserPrefs()
  }, [])

  useEffect(() => {
  fetchLists()
}, [feedMode, userPrefs])

  async function fetchUserPrefs() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('users')
      .select('preferred_genres, preferred_platforms')
      .eq('id', user.id)
      .single()

    if (data) {
      setUserPrefs({
        genres: data.preferred_genres || [],
        platforms: data.preferred_platforms || []
      })
    }
  }

  async function fetchLists() {
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('lists')
      .select(`
        id,
        title,
        list_type,
        user_id,
        users (username),
        list_games (
          games (genres, platforms)
        )
      `)
      .eq('is_public', true)
      .neq('user_id', user.id)

    const { data, error } = await query

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const processed = data.map(list => {
      const allGenres = [...new Set(list.list_games.flatMap(lg => lg.games?.genres || []))]
      const allPlatforms = [...new Set(list.list_games.flatMap(lg => lg.games?.platforms || []))]
      const genreTag = allGenres.length > 1 ? 'Mixed' : allGenres[0] || 'Unknown'
      const platformTag = allPlatforms.length > 1 ? 'Mixed' : allPlatforms[0] || 'Unknown'
      const gameCount = list.list_games.length

      const matchesPrefs =
        allGenres.some(g => userPrefs.genres.includes(g)) ||
        allPlatforms.some(p => userPrefs.platforms.includes(p))

      return { ...list, genreTag, platformTag, gameCount, matchesPrefs }
    })

    const filtered = feedMode === 'foryou'
      ? processed.filter(l => l.matchesPrefs)
      : processed.filter(l => !l.matchesPrefs)

    setLists(filtered)
    setLoading(false)
  }

  const dark = theme === 'dark'

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>

      <div className={`border-b px-6 flex items-center justify-between h-14 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <span className="text-base font-medium">Backlog App</span>
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/home')} className="text-blue-400">🏠</button>
          <button onClick={() => navigate('/library')} className={dark ? 'text-gray-400' : 'text-gray-500'}>📚</button>
          <button onClick={() => navigate('/lists')} className={dark ? 'text-gray-400' : 'text-gray-500'}>📋</button>
          <button onClick={() => navigate('/search')} className={dark ? 'text-gray-400' : 'text-gray-500'}>🔍</button>
          <button onClick={() => navigate('/profile')} className="w-7 h-7 rounded-full bg-blue-900 text-blue-300 text-xs font-medium flex items-center justify-center">U</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-medium">Discover lists</h1>
          <div className={`flex rounded-lg border overflow-hidden ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setFeedMode('foryou')}
              className={`px-4 py-1.5 text-xs transition-colors ${feedMode === 'foryou' ? 'bg-blue-600 text-white' : dark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}
            >
              For you
            </button>
            <button
              onClick={() => setFeedMode('explore')}
              className={`px-4 py-1.5 text-xs transition-colors ${feedMode === 'explore' ? 'bg-blue-600 text-white' : dark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}
            >
              Explore
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-gray-400">Loading...</p>
        )}

        {!loading && lists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No lists found. Try switching to Explore.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lists.map(list => (
            <div
              key={list.id}
              onClick={() => navigate(`/list/${list.id}`)}
              className={`rounded-xl border p-4 cursor-pointer transition-colors ${dark ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{list.genreTag}</span>
                <span className="text-xs text-gray-500">{list.platformTag}</span>
              </div>
              <p className="text-sm font-medium mb-1">{list.title}</p>
              <p className="text-xs text-gray-400 mb-3">by @{list.users?.username}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{list.gameCount} games</span>
                <span className="text-xs text-gray-500">→</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}