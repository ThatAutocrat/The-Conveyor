import axios from 'axios'
import { useAuthStore } from '../store/auth'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)

export default api

// --- Auth ---
export const register = (email: string, name: string, password: string) =>
  api.post('/auth/register', { email, name, password })

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const getMe = () => api.get('/auth/me')

export const setGithubToken = (token: string) =>
  api.post('/auth/github-token', { token })

// --- Repos ---
export const getRepos = () => api.get('/api/repos')
export const addRepo = (github_full_name: string) =>
  api.post('/api/repos', { github_full_name })
export const removeRepo = (id: number) => api.delete(`/api/repos/${id}`)
export const syncRepo = (id: number) => api.post(`/api/repos/${id}/sync`)

// --- Pipelines ---
export const getPipelines = (params?: Record<string, any>) =>
  api.get('/api/pipelines', { params })
export const getStats = () => api.get('/api/pipelines/stats')
export const getPipeline = (id: number) => api.get(`/api/pipelines/${id}`)
