import { createRouter, createWebHashHistory } from 'vue-router'
import { AuthToken } from '@/utils/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/Login.vue'),
      meta: {
        title: 'Login',
        transition: 'fade'
      }
    },
    {
      path: '/home',
      name: 'Home',
      component: () => import('@/pages/Home/index.vue'),
      meta: {
        title: 'Home',
        requiresAuth: true,
        transition: 'fade'
      }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/pages/Settings/index.vue'),
      meta: {
        title: 'Settings',
        requiresAuth: true,
        transition: 'fade'
      }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  // Set page title
  if (to.meta?.title) {
    document.title = `${to.meta.title} - StarHub`
  }

  // Check authentication
  const hasAuth = AuthToken.exist()
  
  if (to.meta?.requiresAuth && !hasAuth) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && hasAuth) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router

