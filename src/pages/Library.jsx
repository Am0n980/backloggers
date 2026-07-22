import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Library({ theme }) {
  const [games, setGames] = useState([])
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [platforms, setPlatforms] = useState([])
  const [openDropdown, setOpenDropdown] = useState(null)
  const [stats, setStats] = useState({ total: 0, notStarted: 0, finished: 0 })
  const navigate = useNavigate()
  const dark = theme === 'dark'

  useEffect(() => {
    fetchGames()
    fetchLists()
  }, [])

  async function fetchGames() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('user_games')
      .select(`
        id,
        platform,
        hours_played,
        status,
        games (id, title, cover_url)
      `)
      .eq('user_id', user.id)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const uniquePlatforms = [...new Set(data.map(g => g.platform).filter(Boolean))]
    setPlatforms(uniquePlatforms)

    setStats({
      total: data.length,
      notStarted: data.filter(g => g.status === 'not_started').length,
      finished: data.filter(g => g.status === 'finished').length
    })

    setGames(data)
    setLoading(false)
  }

  async function fetchLists() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('lists')
      .select('id, title')
      .eq('user_id', user.id)

    if (data) setLists(data)
  }

  async function updateStatus(userGameId, newStatus) {
    await supabase
      .from('user_games')
      .update({ status: newStatus })
      .eq('id', userGameId)

    setGames(games.map(g =>
      g.id === userGameId ? { ...g, status: newStatus } : g
    ))
  }

  async function addToList(listId, gameId) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('list_games').insert({
      list_id: listId,
      game_id: gameId,
      added_by: user.id
    })
    setOpenDropdown(null)
  }

  const filtered = games.filter(g => {
    const statusMatch = statusFilter === 'all' || g.status === statusFilter
    const platformMatch = platformFilter === 'all' || g.platform === platformFilter
    return statusMatch && platformMatch
  })

  function statusBadge(status) {
    if (status === 'not_started') return { label: 'Not started', classes: 'bg-yellow-900/40 text-yellow-300' }
    if (status === 'playing') return { label: 'Playing', classes: 'bg-blue-900/40 text-blue-300' }
    if (status === 'finished') return { label: 'Finished', classes: 'bg-green-900/40 text-green-300' }
    return { label: status, classes: 'bg-gray-700 text-gray-300' }
  }

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>

      <div className={`border-b px-6 flex items-center justify-between h-14 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <span className="text-base font-medium">Backlog App</span>
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/home')} className={dark ? 'text-gray-400' : 'text-gray-500'}>🏠</button>
          <button onClick={() => navigate('/library')} className="text-blue-400">📚</button>
          <button onClick={() => navigate('/lists')} className={dark ? 'text-gray-400' : 'text-gray-500'}>📋</button>
          <button onClick={() => navigate('/search')} className={dark ? 'text-gray-400' : 'text-gray-500'}>🔍</button>
          <button onClick={() => navigate('/profile')} className="w-7 h-7 rounded-full bg-blue-900 text-blue-300 text-xs font-medium flex items-center justify-center">U</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-medium">Your library</h1>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
            + Add game
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total games', value: stats.total },
            { label: 'Not started', value: stats.notStarted },
            { label: 'Finished', value: stats.finished }
          ].map(stat => (
            <div key={stat.label} className={`rounded-lg p-4 ${dark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-medium">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {['all', 'not_started', 'playing', 'finished'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white border-blue-500'
                  : dark ? 'bg-transparent text-gray-400 border-gray-700' : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status === 'not_started' ? 'Not started' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className={`ml-auto text-xs px-3 py-1.5 rounded-lg border ${dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}
          >
            <option value="all">All platforms</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loading && <p className="text-sm text-gray-400">Loading...</p>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No games found. Try adjusting your filters or add a game.</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {filtered.map(game => {
            const badge = statusBadge(game.status)
            return (
              <div key={game.id}>
                <div className={`rounded-xl border p-3 flex items-center gap-3 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`w-10 h-14 rounded flex-shrink-0 ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {game.games?.cover_url && (
                      <img src={game.games.cover_url} alt="" className="w-full h-full object-cover rounded" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{game.games?.title}</p>
                    <p className="text-xs text-gray-400">{game.platform} · {game.hours_played || 0} hrs</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === game.id ? null : game.id)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${dark ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}
                    >
                      + Add to list
                    </button>
                    <select
                      value={game.status}
                      onChange={e => updateStatus(game.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border ${badge.classes} border-transparent`}
                    >
                      <option value="not_started">Not started</option>
                      <option value="playing">Playing</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                </div>

                {openDropdown === game.id && (
                  <div className={`rounded-xl border mt-1 p-3 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <p className="text-xs text-gray-400 mb-2">Add to...</p>
                    {lists.length === 0 && (
                      <p className="text-xs text-gray-500">No lists yet. Create one first.</p>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {lists.map(list => (
                        <button
                          key={list.id}
                          onClick={() => addToList(list.id, game.games.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm text-left transition-colors ${dark ? 'border-gray-700 hover:border-gray-500 text-gray-300' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}
                        >
                          {list.title}
                          <span className="text-gray-500">+</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}