import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('librarian@example.com')
  const [password, setPassword] = useState('librarian123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-zinc-950 to-zinc-900">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        {/* <p className="text-sm text-zinc-400">Use demo accounts: <span className="badge">librarian@example.com / librarian123</span> or <span className="badge">borrower@example.com / borrower123</span></p> */}
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input w-full" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button disabled={loading} className="btn w-full">{loading ? 'Signing in…' : 'Sign in'}</button>
        {/* <div className="text-xs text-zinc-500">This is a demo app; do not use real credentials.</div> */}
      </form>
    </div>
  )
}
