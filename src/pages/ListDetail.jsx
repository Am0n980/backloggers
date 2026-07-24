import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'

export default function ListDetail({ theme }) {
  const { id } = useParams()
  const [list, setList] = useState(null)
  const [games, setGames] = useState([])
  const [userVotes, setUserVotes] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddGame, setShowAddGame] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const navigate = useNavigate()
  const dark = theme === 'dark'

  useEffect(() => {
    fetchCurrentUser()
    fetchList()
    fetchGames()
  }, [id])

  async function fetchCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    if (user) fetchUserVotes(user.id)
  }

  async function fetchUserVotes(userId) {
    const { data } = await supabase
      .from('votes')
      .select('game_id')
      .eq('list_id', id)
      .eq('user_id', userId)
    if (data) setUserVotes(data.map(v => v.game_id))
  }

  async function fetchList() {
    const { data } = await supabase
      .from('lists')
      .select(`
        id, title, is_public, list_type, voting_open, user_id,
        users (username)
      `)
      .eq('id', id)
      .single()
    if (data) setList(data)
  }

  async function fetchGames() {
    const { data } = await supabase
      .from('list_games')
      .select(`
        id, position, added_by,
        games (id, title, cover_url, genres, platforms)
      `)
      .eq('list_id', id)
      .order('position', { ascending: true })

    if (data) {
      const gamesWithVotes = await Promise.all(data.map(async lg => {
        const { count } = await supabase
          .from('votes')
          .select('id', { count: 'exact' })
          .eq('list_id', id)
          .eq('game_id', lg.games.id)
        return { ...lg, voteCount: count || 0 }
      }))
      const sorted = gamesWithVotes.sort((a, b) => b.voteCount - a.voteCount)
      setGames(sorted)
    }
    setLoading(false)
  }

  async function castVote(gameId) {
    if (!currentUser) return
    if (userVotes.includes(gameId)) return
    if (!list.voting_open) return

    await supabase.from('votes').insert({
      user_id: currentUser.id,
      list_id: id,
      game_id: gameId
    })

    setUserVotes([...userVotes, gameId])
    fetchGames()
  }

  async function toggleVoting() {
    await supabase
      .from('lists')
      .update({ voting_open: !list.voting_open })
      .eq('id', id)
    setList({ ...list, voting_open: !list.voting_open })
  }

  async function searchGames(query) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    const { data } = await supabase
      .from('games')
      .select('id, title, cover_url')
      .ilike('title', `%${query}%`)
      .limit(10)
    if (data) setSearchResults(data)
  }

  async function addGameToList(game) {
    const alreadyInList = games.some(lg => lg.games.id === game.id)
    if (alreadyInList) return

    await supabase.from('list_games').insert({
      list_id: id,
      game_id: game.id,
      added_by: currentUser.id,
      position: games.length + 1
    })

    setSearchQuery('')
    setSearchResults([])
    setShowAddGame(false)
    fetchGames()
  }

  const isOwner = currentUser && list && currentUser.id === list.user_id

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>

      <div className={`border-b px-6 flex items-center justify-between h-14 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <span className="text-base font-medium">Backlog App</span>
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/home')} className={dark ? 'text-gray-400' : 'text-gray-500'}>🏠</button>
          <button onClick={() => navigate('/library')} className={dark ? 'text-gray-400' : 'text-gray-500'}>📚</button>
          <button onClick={() => navigate('/lists')} className="text-blue-400">📋</button>
          <button onClick={() => navigate('/search')} className={dark ? 'text-gray-400' : 'text-gray-500'}>🔍</button>
          <button onClick={() => navigate('/profile')} className="w-7 h-7 rounded-full bg-blue-900 text-blue-300 text-xs font-medium flex items-center justify-center">U</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {loading && <p className="text-sm text-gray-400">Loading...</p>}

        {!loading && list && (
          <>
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-1">by @{list.users?.username}</p>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-medium mb-2">{list.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {list.is_public
                      ? <span className="text-xs bg-green-900/40 text-green-300 px-2 py-0.5 rounded">Public</span>
                      : <span className={`text-xs px-2 py-0.5 rounded border ${dark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>Private</span>
                    }
                    {list.is_public && (
                      list.voting_open
                        ? <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">Voting open</span>
                        : <span className={`text-xs px-2 py-0.5 rounded border ${dark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>Voting closed</span>
                    )}
                    <span className="text-xs text-gray-500">{games.length} games</span>
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    {list.is_public && (
                      <button
                        onClick={toggleVoting}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${dark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                      >
                        {list.voting_open ? 'Close voting' : 'Reopen voting'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddGame(!showAddGame)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                      + Add game
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showAddGame && (
              <div className={`rounded-xl border p-4 mb-4 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-sm font-medium mb-3">Add a game</p>
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={e => searchGames(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm mb-2 ${dark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                />
                {searchResults.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {searchResults.map(game => (
                      <button
                        key={game.id}
                        onClick={() => addGameToList(game)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${dark ? 'border-gray-700 hover:border-gray-500 text-gray-300' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}
                      >
                        {game.title}
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-xs text-gray-500">No games found matching that name.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {games.map((lg, index) => {
                const game = lg.games
                const hasVoted = userVotes.includes(game.id)
                return (
                  <div
                    key={lg.id}
                    className={`rounded-xl border p-3 flex items-center gap-3 ${hasVoted ? dark ? 'border-blue-700 bg-gray-800' : 'border-blue-300 bg-white' : dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  >
                    <span className="text-sm font-medium text-gray-500 w-6 text-center flex-shrink-0">#{index + 1}</span>
                    <div className={`w-10 h-14 rounded flex-shrink-0 ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {game.cover_url && (
                        <img src={game.cover_url} alt="" className="w-full h-full object-cover rounded" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{game.title}</p>
                      <p className="text-xs text-gray-400">
                        {game.genres?.[0] || 'Unknown'} · {game.platforms?.[0] || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400">{lg.voteCount} votes</span>
                      {list.is_public && list.voting_open && (
                        <button
                          onClick={() => castVote(game.id)}
                          disabled={hasVoted}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            hasVoted
                              ? 'bg-blue-900/30 border-blue-700 text-blue-300 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
                          }`}
                        >
                          {hasVoted ? 'Voted' : 'Vote'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {games.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No games in this list yet.</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}