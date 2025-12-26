import axios, { AxiosInstance } from 'axios'

// 用于调用后端 API 的 axios 实例
const backendHttp: AxiosInstance = axios.create({
  baseURL: '/api', // 通过 Vite proxy 转发到 localhost:7001
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default backendHttp

