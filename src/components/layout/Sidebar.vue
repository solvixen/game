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
      background-color="#16213e"
      text-color="#8a9bb2"
      active-text-color="#74b9ff"
      router
    >
      <el-menu-item index="/">
        <el-icon><Monitor /></el-icon>
        <span>仪表板</span>
      </el-menu-item>
      
      <el-menu-item index="/realtime">
        <el-icon><DataLine /></el-icon>
        <span>实时监控</span>
      </el-menu-item>
      
      <el-menu-item index="/analytics">
        <el-icon><PieChart /></el-icon>
        <span>数据分析</span>
        <el-badge v-if="hasNewData" value="新" class="badge" />
      </el-menu-item>
      
      <el-menu-item index="/alerts">
        <el-icon><Warning /></el-icon>
        <span>告警管理</span>
        <el-badge :value="unreadAlerts" :hidden="unreadAlerts === 0" class="badge" />
      </el-menu-item>
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
        <div class="user-details" v-if="!isCollapse">
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
import { Monitor, DataLine, PieChart, Warning, Fold, Expand } from '@element-plus/icons-vue'
import { useGameDataStore } from '@/store'

const route = useRoute()
const store = useGameDataStore()

// ==================== 状态 ====================
const isCollapse = ref(false)
const unreadAlerts = ref(3)
const hasNewData = ref(true)

// 当前激活菜单
const activeMenu = computed(() => route.path)

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
  window.dispatchEvent(new CustomEvent('sidebar-collapse', { 
    detail: { collapsed: isCollapse.value } 
  }))
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
  background: linear-gradient(180deg, #16213e 0%, #0f3460 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

/* 折叠状态 */
.sidebar.collapsed {
  width: 64px;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.logo h2 {
  color: #74b9ff;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version {
  font-size: 10px;
  color: #8a9bb2;
  background: rgba(138, 155, 178, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

/* 菜单样式 */
.sidebar-menu {
  flex: 1;
  border-right: none !important;
  margin-top: 20px;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(116, 185, 255, 0.1) !important;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(116, 185, 255, 0.2) 0%, transparent 100%);
  border-left: 3px solid #74b9ff;
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
}

/* 折叠状态下的菜单 */
.sidebar.collapsed .sidebar-menu :deep(.el-menu-item span) {
  display: none;
}

.sidebar.collapsed .sidebar-menu :deep(.el-menu-item .el-icon) {
  margin-right: 0;
}

/* 徽章样式 */
.badge {
  margin-left: auto;
  margin-right: 8px;
}

:deep(.el-badge__content) {
  background: #00b894;
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

/* 底部区域 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.collapse-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  width: 32px;
  margin: 0 auto 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  color: #8a9bb2;
  transition: all 0.3s;
}

.collapse-btn:hover {
  background: rgba(116, 185, 255, 0.1);
  color: #74b9ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.user-avatar {
  background: #74b9ff;
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.user-details {
  overflow: hidden;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
  margin-top: 2px;
}

.user-role.admin {
  background: rgba(225, 112, 85, 0.1);
  color: #e17055;
}

.user-role.operator {
  background: rgba(0, 184, 148, 0.1);
  color: #00b894;
}

.user-role.developer {
  background: rgba(253, 203, 110, 0.1);
  color: #fdcb6e;
}

.user-role.viewer {
  background: rgba(138, 155, 178, 0.1);
  color: #8a9bb2;
}

/* 折叠状态下的底部 */
.sidebar.collapsed .user-details {
  display: none;
}

.sidebar.collapsed .user-info {
  justify-content: center;
  padding: 8px 0;
}
</style>