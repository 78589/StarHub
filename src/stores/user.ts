import { defineStore } from 'pinia'
import type { User } from '@/types'

const STORAGE_KEY = 'starhub_user'

export const useUserStore = defineStore('user', {
  state: (): { user: User | null } => {
    // 从 localStorage 恢复用户信息
    const savedUser = localStorage.getItem(STORAGE_KEY)
    if (savedUser) {
      try {
        return { user: JSON.parse(savedUser) }
      } catch (e) {
        console.error('Failed to parse saved user:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    return { user: null }
  },

  getters: {
    isAuthenticated: (state: { user: User | null }) => !!state.user,
    userName: (state: { user: User | null }) => state.user?.login || ''
  },

  actions: {
    setUser(user: User) {
      this.$state.user = user
      // 持久化到 localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    },

    clearUser() {
      this.$state.user = null
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})

