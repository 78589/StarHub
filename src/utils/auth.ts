const APP_TOKEN_KEY = 'app-token'
const GITHUB_TOKEN_KEY = 'github-token'

export const AuthToken = {
  getAppToken(): string | null {
    return localStorage.getItem(APP_TOKEN_KEY)
  },

  getGithubToken(): string | null {
    return localStorage.getItem(GITHUB_TOKEN_KEY)
  },

  setToken(appToken: string, githubToken: string): void {
    localStorage.setItem(APP_TOKEN_KEY, appToken)
    localStorage.setItem(GITHUB_TOKEN_KEY, githubToken)
  },

  clean(): void {
    localStorage.removeItem(APP_TOKEN_KEY)
    localStorage.removeItem(GITHUB_TOKEN_KEY)
  },

  exist(): boolean {
    return !!this.getAppToken()
  }
}

