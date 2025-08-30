import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './styles.css'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Books from './pages/Books'
import Records from './pages/Records'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: <RequireAuth><AppLayout /></RequireAuth>, children: [
    { index: true, element: <Dashboard /> },
    { path: 'books', element: <Books /> },
    { path: 'records', element: <Records /> },
  ]},
  { path: '*', element: <Navigate to="/" /> }
])

function RequireAuth({ children }){
  const token = localStorage.getItem('token')
  if(!token) return <Navigate to="/login" />
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
