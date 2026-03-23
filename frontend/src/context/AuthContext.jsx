import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('ev_user')
      const storedToken = localStorage.getItem('ev_token')
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      }
    } catch {
      localStorage.removeItem('ev_user')
      localStorage.removeItem('ev_token')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (userData, jwtToken) => {
    setUser(userData)
    setToken(jwtToken)
    localStorage.setItem('ev_user', JSON.stringify(userData))
    localStorage.setItem('ev_token', jwtToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('ev_user')
    localStorage.removeItem('ev_token')
    navigate('/login')
  }

  const isAuthenticated = !!user && !!token

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export default AuthContext
