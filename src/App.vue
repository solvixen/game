<template>
  <div id="app" :class="['app', themeClass]">
    <!-- 侧边栏（登录页不显示） -->
    <Sidebar v-if="showSidebar" :class="{ collapsed: isSidebarCollapsed }" />
    
    <!-- 主内容区域 -->
    <div class="main-content" :class="{ 
      'with-sidebar': showSidebar,
      'sidebar-collapsed': isSidebarCollapsed 
    }">
      <!-- 顶部导航栏 -->
      <div class="top-nav" v-if="showSidebar">
        <div class="nav-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="nav-right">
          <el-tooltip content="全屏" placement="bottom">
            <el-button :icon="FullScreen" size="small" @click="toggleFullScreen" />
          </el-tooltip>
          <el-tooltip content="消息" placement="bottom">
            <el-badge :value="3" :hidden="false">
              <el-button :icon="Message" size="small" />
            </el-badge>
          </el-tooltip>
        </div>
      </div>

      <!-- 路由视图 -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { FullScreen, Message } from '@element-plus/icons-vue'
import Sidebar from '@/components/layout/Sidebar.vue'

const route = useRoute()
const isSidebarCollapsed = ref(false)

// 是否显示侧边栏（登录页不显示）
const showSidebar = computed(() => {
  return route.path !== '/login'
})

// 当前页面标题
const currentPageTitle = computed(() => {
  const titleMap = {
    '/': '仪表板',
    '/realtime': '实时监控',
    '/analytics': '数据分析',
    '/alerts': '告警管理'
  }
  return titleMap[route.path] || '游戏监控'
})

// 主题
const themeClass = computed(() => {
  const theme = localStorage.getItem('theme') || 'dark'
  return theme === 'light' ? 'light-theme' : ''
})

// 监听侧边栏折叠事件
const handleSidebarCollapse = (event) => {
  isSidebarCollapsed.value = event.detail.collapsed
}

// 全屏切换
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

onMounted(() => {
  window.addEventListener('sidebar-collapse', handleSidebarCollapse)
})

onUnmounted(() => {
  window.removeEventListener('sidebar-collapse', handleSidebarCollapse)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background: #1a1a2e;
}

/* 主内容区域 */
.main-content {
  min-height: 100vh;
  transition: margin-left 0.3s ease, width 0.3s ease;
}

.main-content.with-sidebar {
  margin-left: 240px;
  width: calc(100% - 240px);
}

.main-content.with-sidebar.sidebar-collapsed {
  margin-left: 64px;
  width: calc(100% - 64px);
}

/* 顶部导航栏 */
.top-nav {
  height: 50px;
  background: #16213e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 面包屑样式 */
:deep(.el-breadcrumb__item .el-breadcrumb__inner) {
  color: #8a9bb2;
  font-weight: normal;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #74b9ff;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 亮色主题 */
.light-theme {
  background: #f5f7fa;
  color: #333;
}

.light-theme .top-nav {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.light-theme :deep(.el-breadcrumb__item .el-breadcrumb__inner) {
  color: #666;
}

.light-theme :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #409eff;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .main-content.with-sidebar {
    margin-left: 0;
    width: 100%;
  }
  
  .main-content.with-sidebar.sidebar-collapsed {
    margin-left: 0;
    width: 100%;
  }
  
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.collapsed {
    transform: translateX(0);
  }
}
</style>