import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { 
      title: '仪表板',
      requiresAuth: true,
      roles: ['admin', 'operator', 'developer', 'viewer']
    }
  },
  {
    path: '/realtime',
    name: 'RealtimeMonitor',
    component: () => import('@/views/RealtimeMonitor.vue'),
    meta: { 
      title: '实时监控',
      requiresAuth: true,
      roles: ['admin', 'operator', 'developer', 'viewer']
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/Analytics.vue'),
    meta: { 
      title: '数据分析',
      requiresAuth: true,
      roles: ['admin', 'operator']
    }
  },
  {
    path: '/alerts',
    name: 'AlertManagement',
    component: () => import('@/views/AlertManagement.vue'),
    meta: { 
      title: '告警管理',
      requiresAuth: true,
      roles: ['admin', 'operator', 'developer']
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
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Forbidden.vue'),
    meta: { 
      title: '无权访问',
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

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - 游戏数据实时监控系统`
  
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole') || 'viewer'
  
  if (to.path === '/login') {
    if (token) {
      next('/')
    } else {
      next()
    }
    return
  }
  
  if (!to.meta.requiresAuth) {
    next()
    return
  }
  
  if (!token) {
    next('/login')
    return
  }
  
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    next('/403')
    return
  }
  
  next()
})

export default router