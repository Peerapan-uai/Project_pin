import axios from 'axios'
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
})

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ev_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401
let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config._skipRedirect && !isRedirecting) {
      isRedirecting = true
      const user = JSON.parse(localStorage.getItem('ev_user') || 'null')
      const isStaff = user?.role === 'admin' || user?.role === 'technician'
      localStorage.removeItem('ev_user')
      localStorage.removeItem('ev_token')
      window.location.href = isStaff ? '/admin/login' : '/login'
    }
    return Promise.reject(error)
  }
)

export default api
