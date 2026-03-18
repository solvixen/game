<template>
  <div class="dashboard">
    <!-- 头部区域 -->
    <div class="header">
      <div class="header-left">
        <h1>🎮 游戏数据实时监控系统</h1>
        <span class="version">v1.0.0</span>
      </div>
      <div class="user-info">
        <span class="welcome-text">欢迎，{{ userName }}</span>
        <span class="role-tag" :class="userRole">
          {{ roleName }}
        </span>
        <el-button 
          type="danger" 
          size="small" 
          @click="logout"
          :icon="SwitchButton"
        >
          退出登录
        </el-button>
      </div>
    </div>

    <!-- 头部统计卡片 -->
    <div class="stats-grid">
      <StatsCard 
        title="在线玩家" 
        :value="metrics.onlinePlayers" 
        trend="up"
        subtitle="当前在线人数"
        :change="12.5"
      />
      <StatsCard 
        title="今日收入" 
        :value="metrics.totalRevenue" 
        format="currency"
        trend="up"
        subtitle="截至现在"
        :change="8.3"
      />
      <StatsCard 
        title="活跃服务器" 
        :value="activeServersCount" 
        change="0"
        :subtitle="`总共${totalServers}台服务器`"
      />
      <StatsCard 
        title="平均延迟" 
        :value="avgLatency" 
        trend="down"
        subtitle="较昨日下降5ms"
        :change="-5"
      />
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <LineChart 
        title="在线玩家趋势" 
        :data="playerTrendData"
      />
      <GaugeChart 
        title="服务器负载" 
        :value="serverLoad"
        max="100"
        unit="%"
      />
    </div>

    <!-- 底部网格 -->
    <div class="bottom-grid">
      <ServerStatusCard :servers="servers" />
      <AlertCard :alerts="alerts" />
    </div>

    <!-- 状态条 -->
    <div class="status-bar">
      <div class="status-item">
        <span class="status-label">最后更新：</span>
        <span class="status-value">{{ lastUpdateTime }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">数据源：</span>
        <span class="status-value">
          <span class="dot online"></span>
          模拟数据
        </span>
      </div>
      <div class="status-item">
        <span class="status-label">当前角色：</span>
        <span class="status-value role-badge" :class="userRole">
          {{ roleName }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SwitchButton } from '@element-plus/icons-vue'
import * as mockData from '@/api/services/mockData'

// 导入组件
import StatsCard from '@/components/dashboard/StatsCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import ServerStatusCard from '@/components/dashboard/ServerStatusCard.vue'
import AlertCard from '@/components/dashboard/AlertCard.vue'

const router = useRouter()

// ==================== 响应式数据 ====================
const metrics = ref({
  onlinePlayers: 0,
  totalRevenue: 0,
  activeServers: 0,
  avgResponseTime: 0
})

const servers = ref([])
const playerStats = ref(null)
const alerts = ref([])

// 加载状态
const loading = ref(false)

// ==================== 获取模拟数据 ====================
const fetchData = async () => {
  loading.value = true
  try {
    // 并行获取所有数据
    const [metricsData, serversData, statsData] = await Promise.all([
      mockData.getGameMetrics(),
      mockData.getServerStatus(),
      mockData.getPlayerStats()
    ])
    
    metrics.value = metricsData
    servers.value = serversData
    playerStats.value = statsData
    
    // 根据服务器状态生成告警
    generateAlerts(serversData)
    
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// ==================== 生成模拟告警 ====================
const generateAlerts = (serversData) => {
  const newAlerts = []
  
  serversData.forEach(server => {
    // CPU 告警
    if (server.cpu > 85) {
      newAlerts.push({
        id: Date.now() + Math.random(),
        level: 'critical',
        type: 'CPU过载',
        message: `${server.name} CPU使用率 ${server.cpu}%`,
        time: new Date().toLocaleTimeString(),
        server: server.name
      })
    } else if (server.cpu > 70) {
      newAlerts.push({
        id: Date.now() + Math.random(),
        level: 'warning',
        type: 'CPU警告',
        message: `${server.name} CPU使用率 ${server.cpu}%`,
        time: new Date().toLocaleTimeString(),
        server: server.name
      })
    }
    
    // 内存告警
    if (server.memory > 80) {
      newAlerts.push({
        id: Date.now() + Math.random(),
        level: 'warning',
        type: '内存不足',
        message: `${server.name} 内存使用率 ${server.memory}%`,
        time: new Date().toLocaleTimeString(),
        server: server.name
      })
    }
    
    // 延迟告警
    if (server.latency > 150) {
      newAlerts.push({
        id: Date.now() + Math.random(),
        level: 'warning',
        type: '延迟过高',
        message: `${server.name} 延迟 ${server.latency}ms`,
        time: new Date().toLocaleTimeString(),
        server: server.name
      })
    }
    
    // 服务器离线告警
    if (server.status === 'offline') {
      newAlerts.push({
        id: Date.now() + Math.random(),
        level: 'critical',
        type: '服务离线',
        message: `${server.name} 已离线`,
        time: new Date().toLocaleTimeString(),
        server: server.name
      })
    }
  })
  
  // 只保留最新的10条告警
  alerts.value = newAlerts.slice(0, 10)
}

// ==================== 计算属性 ====================
const activeServersCount = computed(() => {
  return servers.value.filter(s => s.status === 'online').length
})

const totalServers = computed(() => {
  return servers.value.length
})

const avgLatency = computed(() => {
  const onlineServers = servers.value.filter(s => s.status === 'online')
  if (onlineServers.length === 0) return 0
  const total = onlineServers.reduce((sum, s) => sum + s.latency, 0)
  return Math.round(total / onlineServers.length)
})

const serverLoad = computed(() => {
  const onlineServers = servers.value.filter(s => s.status === 'online')
  if (onlineServers.length === 0) return 0
  const total = onlineServers.reduce((sum, s) => sum + s.cpu, 0)
  return Math.round(total / onlineServers.length)
})

// 生成趋势数据（基于当前在线人数模拟历史数据）
const playerTrendData = computed(() => {
  const currentPlayers = metrics.value.onlinePlayers
  const hours = []
  const data = []
  
  for (let i = 0; i < 24; i++) {
    hours.push(`${i}:00`)
    // 生成围绕当前值的波动数据
    const variation = Math.floor(Math.random() * 500) - 250
    data.push(Math.max(500, currentPlayers + variation))
  }
  
  return {
    labels: hours,
    datasets: [{
      name: '在线玩家',
      data: data
    }]
  }
})

// ==================== 用户信息 ====================
const userName = computed(() => {
  return localStorage.getItem('userName') || '管理员'
})

const userRole = computed(() => {
  return localStorage.getItem('userRole') || 'admin'
})

const roleName = computed(() => {
  const roleMap = {
    admin: '管理员',
    operator: '运营人员',
    developer: '开发人员',
    viewer: '观察员'
  }
  return roleMap[userRole.value] || '管理员'
})

// ==================== 时间显示 ====================
const lastUpdateTime = ref('')

const updateLastUpdateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  lastUpdateTime.value = `${hours}:${minutes}:${seconds}`
}

// ==================== 定时更新 ====================
let timer = null
let dataTimer = null

// 手动刷新
const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

// ==================== 退出登录 ====================
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
    center: true
  }).then(() => {
    localStorage.clear()
    ElMessage.success('已退出登录')
    setTimeout(() => {
      router.push('/login')
    }, 500)
  }).catch(() => {
    ElMessage.info('已取消退出')
  })
}

// ==================== 生命周期 ====================
onMounted(() => {
  fetchData()
  updateLastUpdateTime()
  
  // 每秒更新一次时间
  timer = setInterval(updateLastUpdateTime, 1000)
  
  // 每30秒刷新一次数据
  dataTimer = setInterval(fetchData, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (dataTimer) clearInterval(dataTimer)
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  min-height: 100vh;
  background: #1a1a2e;
  color: #fff;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  font-size: 22px;
  margin: 0;
  color: #fff;
  font-weight: 600;
  background: linear-gradient(135deg, #74b9ff, #a29bfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.version {
  font-size: 12px;
  color: #8a9bb2;
  background: rgba(138, 155, 178, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-text {
  color: #8a9bb2;
  font-size: 14px;
}

.role-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(116, 185, 255, 0.1);
  border: 1px solid rgba(116, 185, 255, 0.3);
}

.role-tag.admin {
  background: rgba(225, 112, 85, 0.1);
  border-color: rgba(225, 112, 85, 0.3);
  color: #e17055;
}

.role-tag.operator {
  background: rgba(0, 184, 148, 0.1);
  border-color: rgba(0, 184, 148, 0.3);
  color: #00b894;
}

.role-tag.developer {
  background: rgba(253, 203, 110, 0.1);
  border-color: rgba(253, 203, 110, 0.3);
  color: #fdcb6e;
}

.role-tag.viewer {
  background: rgba(138, 155, 178, 0.1);
  border-color: rgba(138, 155, 178, 0.3);
  color: #8a9bb2;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* 底部网格 */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* 状态条 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #0f3460;
  border-radius: 8px;
  font-size: 13px;
  color: #8a9bb2;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  color: #6c7983;
}

.status-value {
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.online {
  background: #00b894;
  box-shadow: 0 0 8px rgba(0, 184, 148, 0.5);
}

.role-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.role-badge.admin {
  background: rgba(225, 112, 85, 0.15);
  color: #e17055;
}

.role-badge.operator {
  background: rgba(0, 184, 148, 0.15);
  color: #00b894;
}

.role-badge.developer {
  background: rgba(253, 203, 110, 0.15);
  color: #fdcb6e;
}

.role-badge.viewer {
  background: rgba(138, 155, 178, 0.15);
  color: #8a9bb2;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .charts-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .user-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  .user-info {
    flex-wrap: wrap;
  }
}
</style>