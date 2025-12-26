import { defineStore } from 'pinia'
import type { Theme, Language } from '@/types'

export const useThemeStore = defineStore('theme', {
  state: () => {
    const savedTheme = localStorage.getItem('app-theme') as Theme
    const savedLanguage = localStorage.getItem('app-language') as Language

    const theme: Theme = savedTheme || 'dark'

    const language: Language = savedLanguage || 'zh'

    return {
      theme,
      language
    }
  },

  actions: {
    setTheme(theme: Theme) {
      this.$state.theme = theme
      localStorage.setItem('app-theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
      document.body.setAttribute('data-theme', theme)
      document.body.classList.toggle('dark', theme === 'dark')
      
      // 同时设置 html class
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      const themeColor = theme === 'dark' ? '#1a1a1a' : '#ffffff'
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) {
        meta.setAttribute('content', themeColor)
      }
    },

    toggleTheme() {
      const newTheme: Theme = this.$state.theme === 'dark' ? 'light' : 'dark'
      this.setTheme(newTheme)
    },

    setLanguage(language: Language) {
      this.$state.language = language
      localStorage.setItem('app-language', language)
      localStorage.setItem('app-locale', language)
      
      // Update i18n locale if available
      if (typeof window !== 'undefined' && (window as any).__VUE_I18N__) {
        (window as any).__VUE_I18N__.global.locale.value = language
      }
    }
  }
})

