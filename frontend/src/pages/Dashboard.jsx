import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Dashboard(){
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(()=>{
    api('/api/stats').then(setStats).catch(e=>setError(e.message))
  },[])

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {error && <div className="text-red-400">{error}</div>}
      {!stats ? <div>Loading…</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard title="Total Books" value={stats.totalBooks} />
          <StatCard title="Copies Available" value={stats.availableCount} />
          <StatCard title="Active Borrows" value={stats.borrowedCount} />
          <StatCard title="My Active Borrows" value={stats.myBorrowed} />
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value }){
  return (
    <div className="card">
      <div className="text-zinc-400 text-sm">{title}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  )
}
