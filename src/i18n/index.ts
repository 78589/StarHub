import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'

const savedLocale = localStorage.getItem('app-locale') || localStorage.getItem('app-language') || navigator.language.split('-')[0] || 'en'
const locale = savedLocale === 'zh' || savedLocale === 'zh-CN' ? 'zh' : 'en'

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: {
    zh,
    en
  }
})

export default i18n

