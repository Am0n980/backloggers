import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Lists({ theme }) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewList, setShowNewList] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('standard')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const dark = theme === 'dark'

  useEffect(() => {
    fetchLists()
  }, [])

  async function fetchLists() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('lists')
      .select(`
        id,
        title,
        is_public,
        list_type,
        voting_open,
        list_games (id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setLists(data)
    }
    setLoading(false)
  }

  async function createList() {
    if (!newTitle.trim()) return
    setCreating(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('lists').insert({
      user_id: user.id,
      title: newTitle.trim(),
      is_public: false,
      list_type: newType,
      voting_open: true
    })

    if (error) {
      setError(error.message)
    } else {
      setNewTitle('')
      setNewType('standard')
      setShowNewList(false)
      fetchLists()
    }
    setCreating(false)
  }

  async function togglePublic(list) {
    const gameCount = list.list_games?.length || 0
    if (!list.is_public && gameCount < 5) {
      alert('A list needs at least 5 games before it can be made public.')
      return
    }
    await supabase
      .from('lists')
      .update({ is_public: !list.is_public })
      .eq('id', list.id)
    fetchLists()
  }

  async function toggleVoting(list) {
    await supabase
      .from('lists')
      .update({ voting_open: !list.voting_open })
      .eq('id', list.id)
    fetchLists()
  }

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

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-medium">Your lists</h1>
          <button
            onClick={() => setShowNewList(!showNewList)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            + New list
          </button>
        </div>

        {showNewList && (
          <div className={`rounded-xl border p-4 mb-4 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className="text-sm font-medium mb-3">Create a new list</p>
            <input
              type="text"
              placeholder="List title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm mb-3 ${dark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <div className="flex gap-2 mb-3">
              {['standard', 'discovery'].map(type => (
                <button
                  key={type}
                  onClick={() => setNewType(type)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${newType === type ? 'bg-blue-600 text-white border-blue-500' : dark ? 'bg-transparent text-gray-400 border-gray-700' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={createList}
                disabled={creating || !newTitle.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowNewList(false)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading && <p className="text-sm text-gray-400">Loading...</p>}

        {!loading && lists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No lists yet. Create your first one.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {lists.map(list => {
            const gameCount = list.list_games?.length || 0
            return (
              <div
                key={list.id}
                className={`rounded-xl border p-4 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p
                      className="text-sm font-medium mb-1 cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => navigate(`/list/${list.id}`)}
                    >
                      {list.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {gameCount} {gameCount === 1 ? 'game' : 'games'} · {list.list_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {list.is_public ? (
                      <span className="text-xs bg-green-900/40 text-green-300 px-2 py-0.5 rounded">Public</span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded border ${dark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>Private</span>
                    )}
                    {list.is_public && (
                      list.voting_open
                        ? <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">Voting open</span>
                        : <span className={`text-xs px-2 py-0.5 rounded border ${dark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>Voting closed</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/list/${list.id}`)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${dark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => togglePublic(list)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${dark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                  >
                    {list.is_public ? 'Make private' : 'Make public'}
                  </button>
                  {list.is_public && (
                    <button
                      onClick={() => toggleVoting(list)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${dark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                    >
                      {list.voting_open ? 'Close voting' : 'Reopen voting'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}