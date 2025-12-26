import backendHttp from './backend'
import type { AxiosResponse } from 'axios'

export const authApi = {
  // 交换 GitHub OAuth code 获取 token
  getToken(code: string): Promise<AxiosResponse<{
    token: string
    token_type: string
    access_token: string
  }>> {
    return backendHttp.get(`/getToken?code=${code}`)
  }
}

