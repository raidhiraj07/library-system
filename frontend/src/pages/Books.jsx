import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Books(){
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [books, setBooks] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title:'', author:'', isbn:'', description:'', copies:1 })
  const [editingId, setEditingId] = useState(null)

  function load(){
    api('/api/books').then(setBooks).catch(e=>setError(e.message))
  }
  useEffect(()=>{ load() }, [])

  async function addBook(e){
    e.preventDefault()
    try {
      await api('/api/books', { method:'POST', body: form })
      setForm({ title:'', author:'', isbn:'', description:'', copies:1 })
      load()
    } catch(e){ setError(e.message) }
  }

  async function updateBook(id){
    try {
      await api('/api/books/' + id, { method:'PUT', body: form })
      setEditingId(null); setForm({ title:'', author:'', isbn:'', description:'', copies:1 })
      load()
    } catch(e){ setError(e.message) }
  }

  async function deleteBook(id){
    if(!confirm('Delete this book?')) return
    try { await api('/api/books/' + id, { method:'DELETE' }); load() }
    catch(e){ setError(e.message) }
  }

  async function borrow(id){
    try { await api('/api/borrow/' + id, { method:'POST' }); load() }
    catch(e){ setError(e.message) }
  }

  function startEdit(b){
    setEditingId(b.id)
    setForm({ title:b.title, author:b.author, isbn:b.isbn, description:b.description, copies:b.copiesTotal })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Books</h1>
        <div className="text-sm text-zinc-400">Role: <span className="badge">{user.role}</span></div>
      </div>
      {error && <div className="text-red-400 mt-2">{error}</div>}

      {user.role === 'librarian' && (
        <form onSubmit={editingId ? (e)=>{e.preventDefault(); updateBook(editingId)} : addBook} className="card mt-4 grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
            <input className="input" placeholder="Author" value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} required />
            <input className="input" placeholder="ISBN" value={form.isbn} onChange={e=>setForm(f=>({...f,isbn:e.target.value}))} />
            <input className="input" type="number" min="1" placeholder="Copies" value={form.copies} onChange={e=>setForm(f=>({...f,copies:Number(e.target.value)}))} />
            <textarea className="input sm:col-span-2" placeholder="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="flex gap-2">
            <button className="btn">{editingId ? 'Update Book' : 'Add Book'}</button>
            {editingId && <button type="button" className="btn bg-zinc-700 hover:bg-zinc-600" onClick={()=>{setEditingId(null); setForm({ title:'', author:'', isbn:'', description:'', copies:1 })}}>Cancel</button>}
          </div>
        </form>
      )}

      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="text-zinc-400">
              <th className="th">Title</th>
              <th className="th">Author</th>
              <th className="th">ISBN</th>
              <th className="th">Copies</th>
              <th className="th">Available</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map(b => (
              <tr key={b.id}>
                <td className="td">{b.title}</td>
                <td className="td">{b.author}</td>
                <td className="td">{b.isbn}</td>
                <td className="td">{b.copiesTotal}</td>
                <td className="td">{b.copiesAvailable}</td>
                <td className="td">
                  <div className="flex gap-2">
                    {user.role === 'librarian' ? (
                      <>
                        <button className="btn" onClick={()=>startEdit(b)}>Edit</button>
                        <button className="btn bg-red-600 hover:bg-red-500" onClick={()=>deleteBook(b.id)}>Delete</button>
                      </>
                    ) : (
                      <button disabled={b.copiesAvailable<=0} className="btn disabled:opacity-50" onClick={()=>borrow(b.id)}>
                        {b.copiesAvailable<=0 ? 'Not available' : 'Borrow'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
