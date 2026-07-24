import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'

export default function Profile({ theme }) {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [lists, setLists] = useState([])
  const [votedLists, setVotedLists] = useState([])
  const [stats, setStats] = useState({ publicLists: 0, games: 0, votes: 0 })
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const navigate = useNavigate()
  const dark = theme === 'dark'

  useEffect(() => {
    fetchProfile()
  }, [username])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profileData } = await supabase
      .from('users')
      .select('id, username, avatar_url, created_at, profile_private')
      .eq('username', username)
      .single()

    if (!profileData) {
      setLoading(false)
      return
    }

    setProfile(profileData)
    setIsOwnProfile(user?.id === profileData.id)

    if (profileData.profile_private && user?.id !== profileData.id) {
      setLoading(false)
      return
    }

    const { data: listsData } = await supabase
      .from('lists')
      .select('id, title, list_games(id)')
      .eq('user_id', profileData.id)
      .eq('is_public', true)

    if (listsData) {
      setLists(listsData)
    }

    const { data: votesData } = await supabase
      .from('votes')
      .select('list_id')
      .eq('user_id', profileData.id)

    if (votesData) {
      const uniqueListIds = [...new Set(votesData.map(v => v.list_id))]
      const { data: votedListsData } = await supabase
        .from('lists')
        .select('id, title, list_games(id), users(username)')
        .in('id', uniqueListIds.length > 0 ? uniqueListIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('is_public', true)

      if (votedListsData) setVotedLists(votedListsData)
    }

    const { count: gamesCount } = await supabase
      .from('user_games')
      .select('id', { count: 'exact' })
      .eq('user_id', profileData.id)

    const { count: votesCount } = await supabase
      .from('votes')
      .select('id', { count: 'exact' })
      .eq('user_id', profileData.id)

    setStats({
      publicLists: listsData?.length || 0,
      games: gamesCount || 0,
      votes: votesCount || 0
    })

    setLoading(false)
  }

  const initials = profile?.username?.charAt(0).toUpperCase() || 'U'

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>

      <div className={`border-b px-6 flex items-center justify-between h-14 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <span className="text-base font-medium">Backlog App</span>
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/home')} className={dark ? 'text-gray-400' : 'text-gray-500'}>🏠</button>
          <button onClick={() => navigate('/library')} className={dark ? 'text-gray-400' : 'text-gray-500'}>📚</button>
          <button onClick={() => navigate('/lists')} className={dark ? 'text-gray-400' : 'text-gray-500'}>📋</button>
          <button onClick={() => navigate('/search')} className={dark ? 'text-gray-400' : 'text-gray-500'}>🔍</button>
          <button onClick={() => navigate('/profile')} className="w-7 h-7 rounded-full bg-blue-900 text-blue-300 text-xs font-medium flex items-center justify-center">U</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {loading && <p className="text-sm text-gray-400">Loading...</p>}

        {!loading && !profile && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">User not found.</p>
          </div>
        )}

        {!loading && profile && profile.profile_private && !isOwnProfile && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-blue-900/40 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-medium text-blue-300">{initials}</span>
            </div>
            <p className="text-lg font-medium mb-2">@{profile.username}</p>
            <p className="text-gray-400 text-sm">This profile is private.</p>
          </div>
        )}

        {!loading && profile && (!profile.profile_private || isOwnProfile) && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-medium text-blue-300">{initials}</span>
              </div>
              <div>
                <p className="text-lg font-medium mb-0.5">@{profile.username}</p>
                <p className="text-xs text-gray-400">
                  Member since {new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/settings')}
                  className={`ml-auto text-xs px-3 py-1.5 rounded-lg border transition-colors ${dark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                >
                  Edit profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Public lists', value: stats.publicLists },
                { label: 'Games in library', value: stats.games },
                { label: 'Votes cast', value: stats.votes }
              ].map(stat => (
                <div key={stat.label} className={`rounded-lg p-4 ${dark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-xl font-medium">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Public lists</p>
              {lists.length === 0 && (
                <p className="text-sm text-gray-400">No public lists yet.</p>
              )}
              <div className="flex flex-col gap-2">
                {lists.map(list => (
                  <div
                    key={list.id}
                    onClick={() => navigate(`/list/${list.id}`)}
                    className={`rounded-xl border p-3 flex items-center justify-between cursor-pointer transition-colors ${dark ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{list.title}</p>
                      <p className="text-xs text-gray-400">{list.list_games?.length || 0} games</p>
                    </div>
                    <span className={dark ? 'text-gray-500' : 'text-gray-400'}>→</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Lists voted on</p>
              {votedLists.length === 0 && (
                <p className="text-sm text-gray-400">No votes cast yet.</p>
              )}
              <div className="flex flex-col gap-2">
                {votedLists.map(list => (
                  <div
                    key={list.id}
                    onClick={() => navigate(`/list/${list.id}`)}
                    className={`rounded-xl border p-3 flex items-center justify-between cursor-pointer transition-colors ${dark ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{list.title}</p>
                      <p className="text-xs text-gray-400">by @{list.users?.username} · {list.list_games?.length || 0} games</p>
                    </div>
                    <span className={dark ? 'text-gray-500' : 'text-gray-400'}>→</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}