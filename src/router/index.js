import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { 
      title: '仪表板',
      requiresAuth: true 
    }
  },
  {
    path: '/realtime',
    name: 'RealtimeMonitor',
    component: () => import('@/views/RealtimeMonitor.vue'),
    meta: { 
      title: '实时监控',
      requiresAuth: true 
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/Analytics.vue'),
    meta: { 
      title: '数据分析',
      requiresAuth: true 
    }
  },
  {
    path: '/alerts',
    name: 'AlertManagement',
    component: () => import('@/views/AlertManagement.vue'),
    meta: { 
      title: '告警管理',
      requiresAuth: true 
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false 
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { 
      title: '页面不存在',
      requiresAuth: false 
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 权限控制
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title} - 游戏数据实时监控系统`
  
  // 检查是否需要登录
  const requiresAuth = to.meta.requiresAuth
  const isLoggedIn = localStorage.getItem('token')
  
  if (requiresAuth && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router