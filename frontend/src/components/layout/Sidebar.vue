<template>
  <div class="sidebar">
    <div class="logo">
      <h2>🎮 游戏监控</h2>
      <span class="version">v1.0.0</span>
    </div>

    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      :collapse="isCollapse"
      background-color="#ffffff"
      text-color="#374151"
      active-text-color="#1a56db"
      router
    >
      <template v-for="item in visibleMenuItems" :key="item.index">
        <el-menu-item :index="item.index">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
          <el-badge
            v-if="item.badge !== undefined && item.badge !== 0"
            :value="item.badge"
            class="badge"
          />
        </el-menu-item>
      </template>
    </el-menu>

    <div class="sidebar-footer">
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon>
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
      </div>

      <div class="user-info">
        <el-avatar :size="32" :src="userAvatar" class="user-avatar">
          {{ userInitial }}
        </el-avatar>
        <div v-if="!isCollapse" class="user-details">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role" :class="userRole">{{ roleName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Monitor, DataLine, PieChart, Warning, User, Fold, Expand } from '@element-plus/icons-vue'
import { useGameDataStore } from '@/store'

const route = useRoute()
const store = useGameDataStore()

// ==================== 状态 ====================
const isCollapse = ref(false)
const unreadAlerts = ref(3)
const hasNewData = ref(true)

// 当前激活菜单
const activeMenu = computed(() => route.path)

// 全量菜单项（含角色权限）
const allMenuItems = [
  {
    index: '/',
    title: '仪表板',
    icon: Monitor,
    roles: ['admin', 'operator', 'developer', 'viewer']
  },
  {
    index: '/realtime',
    title: '实时监控',
    icon: DataLine,
    roles: ['admin', 'operator', 'developer']
  },
  { index: '/analytics', title: '数据分析', icon: PieChart, roles: ['admin', 'operator'] },
  { index: '/alerts', title: '告警管理', icon: Warning, roles: ['admin', 'operator', 'developer'] },
  { index: '/users', title: '用户管理', icon: User, roles: ['admin'] }
]

// 根据角色过滤可见菜单
const visibleMenuItems = computed(() => {
  return allMenuItems
    .filter((item) => item.roles.includes(userRole.value))
    .map((item) => {
      let badge = undefined
      if (item.index === '/analytics' && hasNewData.value) badge = '新'
      if (item.index === '/alerts') badge = unreadAlerts.value
      return { ...item, badge }
    })
})

// 用户信息
const userName = computed(() => localStorage.getItem('userName') || '管理员')
const userRole = computed(() => localStorage.getItem('userRole') || 'admin')
const userAvatar = ref('')

// 用户头像首字母
const userInitial = computed(() => {
  return userName.value.charAt(0)
})

// 角色名称
const roleName = computed(() => {
  const roleMap = {
    admin: '管理员',
    operator: '运营人员',
    developer: '开发人员',
    viewer: '观察员'
  }
  return roleMap[userRole.value] || '管理员'
})

// ==================== 方法 ====================
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
  // 触发自定义事件，通知主内容区域调整边距
  window.dispatchEvent(
    new CustomEvent('sidebar-collapse', {
      detail: { collapsed: isCollapse.value }
    })
  )
}

// 模拟实时更新未读告警
let timer = null
const updateAlerts = () => {
  // 随机更新未读告警数量
  unreadAlerts.value = Math.floor(Math.random() * 5)
}

onMounted(() => {
  timer = setInterval(updateAlerts, 30000) // 每30秒更新一次
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #d1d5db;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

.sidebar.collapsed {
  width: 64px;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.logo h2 {
  color: #1a56db;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.2s;
}

.version {
  font-size: 10px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.sidebar.collapsed .version {
  opacity: 0;
  width: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  margin-top: 20px;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 8px;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.sidebar-menu :deep(.el-menu-item::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: rgba(26, 86, 219, 0.08);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
}

.sidebar-menu :deep(.el-menu-item:hover::before) {
  width: 100%;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: transparent !important;
  color: #1a56db;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(26, 86, 219, 0.1) !important;
  color: #1a56db;
  font-weight: 600;
}

.sidebar-menu :deep(.el-menu-item.is-active::before) {
  width: 100%;
  background: rgba(26, 86, 219, 0.06);
}

.sidebar-menu :deep(.el-menu-item.is-active::after) {
  content: '';
  position: absolute;
  left: 0;
  top: 15%;
  bottom: 15%;
  width: 3px;
  background: #1a56db;
  border-radius: 0 3px 3px 0;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scaleY(0);
  }
  to {
    opacity: 1;
    transform: scaleY(1);
  }
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  transition: transform 0.3s;
}

.sidebar-menu :deep(.el-menu-item:hover .el-icon) {
  transform: scale(1.15);
}

.sidebar-menu :deep(.el-menu-item span) {
  transition: opacity 0.2s;
}

.sidebar.collapsed .sidebar-menu :deep(.el-menu-item span) {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar.collapsed .sidebar-menu :deep(.el-menu-item .el-icon) {
  margin-right: 0;
}

.badge {
  margin-left: auto;
  margin-right: 8px;
}

:deep(.el-badge__content) {
  background: #e02424;
  border: none;
  color: #fff;
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 6px;
}

:deep(.el-badge__content.is-fixed) {
  transform: translateY(-50%) translateX(0);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.collapse-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 34px;
  width: 34px;
  margin: 0 auto 12px;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-btn:hover {
  background: #dbeafe;
  color: #1a56db;
  transform: scale(1.08);
}

.collapse-btn:active {
  transform: scale(0.95);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f3f4f6;
}

.user-avatar {
  background: linear-gradient(135deg, #1a56db, #7c3aed);
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
  transition: transform 0.3s;
}

.user-info:hover .user-avatar {
  transform: scale(1.05);
}

.user-details {
  overflow: hidden;
  transition: opacity 0.2s;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  margin-top: 3px;
  transition: all 0.3s;
}

.user-role.admin {
  background: #fee2e2;
  color: #b91c1c;
}

.user-role.operator {
  background: #d1fae5;
  color: #065f46;
}

.user-role.developer {
  background: #fef3c7;
  color: #92400e;
}

.user-role.viewer {
  background: #f3f4f6;
  color: #374151;
}

.sidebar.collapsed .user-details {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar.collapsed .user-info {
  justify-content: center;
  padding: 10px 0;
}
</style>
