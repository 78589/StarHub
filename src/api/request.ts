import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AuthToken } from '@/utils/auth'

const http: AxiosInstance = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.v3+json'
  }
})

// Request interceptor
http.interceptors.request.use(
  (config) => {
    const token = AuthToken.getGithubToken()
    if (token) {
      // 原项目存储的 token 已经是完整格式（如 "token ghp_xxxxx"），直接使用
      config.headers.Authorization = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
http.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      AuthToken.clean()
      window.location.href = '/#/login'
    }
    return Promise.reject(error)
  }
)

export default http

