import React, {createContext, useContext, useState} from 'react'
import apiClient from '../api/apiClient'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const login = async (nickname, password) => {
    try {
      const response = await apiClient.post('/auth/login', { nickname, password })
      setUser(response.data)
      localStorage.setItem('userData', JSON.stringify(response.data))
      return response.data
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('userData')
    }
  }

  // JWT 토큰 관련 로직 모두 제거

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext