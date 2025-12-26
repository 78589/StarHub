import linkHeader from 'http-link-header'
import qs from 'query-string'
import type { PaginationInfo } from '@/types'

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getPageFromLinkStr = (linkStr: string): number => {
  const link = linkHeader.parse(linkStr)
  const refs = link.get('rel', 'last')
  if (refs.length) {
    const res = qs.parseUrl(refs[0].uri)
    return Number(res.query.page) || 1
  }
  return 1
}

export const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export const downloadString = (
  text: string,
  fileType: string,
  fileName: string
): void => {
  const blob = new Blob([text], { type: fileType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.download = fileName
  a.href = url
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export const openWindowCenter = (
  url: string,
  title: string,
  width: number,
  height: number
): Window | null => {
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY

  const screenWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    screen.width
  const screenHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    screen.height

  const systemZoom = screenWidth / window.screen.availWidth
  const left = (screenWidth - width) / 2 / systemZoom + dualScreenLeft
  const top = (screenHeight - height) / 2 / systemZoom + dualScreenTop

  const newWindow = window.open(
    url,
    title,
    `scrollbars=yes, width=${width / systemZoom}, height=${height / systemZoom}, top=${top}, left=${left}`
  )

  if (newWindow && window.focus) {
    newWindow.focus()
  }

  return newWindow
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

