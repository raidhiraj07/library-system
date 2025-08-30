import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export default function AppLayout(){
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  function logout(){
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="bg-zinc-950 border-r border-zinc-900 p-4">
        <div className="text-xl font-bold mb-6">📚 Library</div>
        <nav className="space-y-2">
          <NavLink to="/" end className={({isActive})=> 'block px-3 py-2 rounded-xl ' + (isActive ? 'bg-zinc-800' : 'hover:bg-zinc-900')}>Dashboard</NavLink>
          <NavLink to="/books" className={({isActive})=> 'block px-3 py-2 rounded-xl ' + (isActive ? 'bg-zinc-800' : 'hover:bg-zinc-900')}>Books</NavLink>
          <NavLink to="/records" className={({isActive})=> 'block px-3 py-2 rounded-xl ' + (isActive ? 'bg-zinc-800' : 'hover:bg-zinc-900')}>Borrow Records</NavLink>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-zinc-400 mb-2">Signed in as</div>
          <div className="badge">{user?.email} • {user?.role}</div>
          <button onClick={logout} className="btn w-full mt-3">Sign out</button>
        </div>
      </aside>
      <main className="p-6 space-y-6">
        <Outlet />
      </main>
    </div>
  )
}
