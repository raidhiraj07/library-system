import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Records(){
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')

  function load(){
    api('/api/borrows').then(setRecords).catch(e=>setError(e.message))
  }
  useEffect(()=>{ load() }, [])

  async function returnBook(id){
    try { await api('/api/return/' + id, { method:'POST' }); load() }
    catch(e){ setError(e.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Borrow Records</h1>
        <div className="text-sm text-zinc-400">Role: <span className="badge">{user.role}</span></div>
      </div>
      {error && <div className="text-red-400 mt-2">{error}</div>}

      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="text-zinc-400">
              <th className="th">Book</th>
              <th className="th">Borrower</th>
              <th className="th">Borrowed At</th>
              <th className="th">Due</th>
              <th className="th">Returned</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td className="td">{r.book?.title || 'Deleted book'}</td>
                <td className="td">{r.user || 'Unknown'}</td>
                <td className="td">{new Date(r.borrowedAt).toLocaleString()}</td>
                <td className="td">{new Date(r.dueAt).toLocaleDateString()}</td>
                <td className="td">{r.returnedAt ? new Date(r.returnedAt).toLocaleString() : '—'}</td>
                <td className="td">
                  {!r.returnedAt && (
                    <button className="btn" onClick={()=>returnBook(r.id)}>Mark Returned</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
