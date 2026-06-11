<template>
  <div class="dashboard">
    <!-- 头部区域 -->
    <div class="header">
      <div class="header-left">
        <h1>🎮 游戏数据实时监控系统</h1>
        <span class="version">v1.0.0</span>
        <span v-if="isConnected" class="ws-latency" :class="latencyClass">
          🕐 {{ wsLatency }}ms
        </span>
      </div>
      <div class="user-info">
        <span class="welcome-text">欢迎，{{ userName }}</span>
        <span class="role-tag" :class="userRole">{{ roleName }}</span>
        <el-button type="danger" size="small" :icon="SwitchButton" @click="logout">
          退出登录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="card-drill" title="点击查看实时数据" @click="goRealtime">
        <StatsCard
          title="在线玩家"
          :value="metrics.onlinePlayers || 0"
          trend="up"
          subtitle="当前在线人数 → 实时监控"
          theme="blue"
        />
      </div>
      <StatsCard
        title="今日收入"
        :value="metrics.revenue || 0"
        format="currency"
        trend="up"
        subtitle="截至现在"
        theme="gold"
      />
      <StatsCard
        title="活跃服务器"
        :value="activeServersCount"
        subtitle="当前在线服务器"
        theme="green"
      />
      <div class="card-drill" title="点击查看延迟详情" @click="goRealtime">
        <StatsCard
          title="平均延迟"
          :value="metrics.latency || 0"
          trend="down"
          subtitle="实时延迟 → 实时监控"
          unit="ms"
          theme="orange"
        />
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="card-drill" title="点击查看详细趋势分析" @click="goAnalytics">
        <LineChart title="在线玩家趋势 → 数据分析" :data="trendData" />
      </div>
      <div class="card-drill" title="点击查看服务器详情" @click="goRealtime">
        <GaugeChart title="服务器负载 → 实时监控" :value="avgCpuLoad" :max="100" unit="%" />
      </div>
    </div>

    <!-- 服务器状态和告警 -->
    <div class="bottom-grid">
      <div class="card-drill" title="点击查看服务器详情" @click="goRealtime">
        <ServerStatusCard :servers="servers" />
      </div>
      <div class="card-drill" title="点击查看告警详情" @click="goAlerts">
        <AlertCard :alerts="alerts" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { SwitchButton } from '@element-plus/icons-vue'
import httpClient from '@/api/httpClient'
import websocket from '@/api/websocket'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import ServerStatusCard from '@/components/dashboard/ServerStatusCard.vue'
import AlertCard from '@/components/dashboard/AlertCard.vue'

const router = useRouter()

// ==================== 数据状态 ====================
const metrics = ref({ onlinePlayers: 0, revenue: 0, activeServers: 0, latency: 0 })
const servers = ref([])
const alerts = ref([])
const trendData = ref({ labels: [], dauData: [], revenueData: [] })
const loading = ref(false)
const wsLatency = ref(0)
const isConnected = ref(false) // WebSocket 连接状态
let unsubStatus = null

// ==================== 延迟分级样式 ====================
const latencyClass = computed(() => {
  if (wsLatency.value <= 5) return 'latency-good'
  if (wsLatency.value <= 20) return 'latency-normal'
  if (wsLatency.value <= 150) return 'latency-slow'
  return 'latency-bad'
})

// ==================== 用户信息 ====================
const userName = computed(() => localStorage.getItem('userName') || '管理员')
const userRole = computed(() => localStorage.getItem('userRole') || 'admin')
const roleName = computed(() => {
  const map = { admin: '管理员', operator: '运营人员', developer: '开发人员', viewer: '观察员' }
  return map[userRole.value] || '管理员'
})

// ==================== 计算属性 ====================
const activeServersCount = computed(() => {
  return servers.value.filter((s) => s.status === 'online').length
})

const avgCpuLoad = computed(() => {
  const online = servers.value.filter((s) => s.status === 'online')
  if (online.length === 0) return 0
  const total = online.reduce((sum, s) => sum + (s.cpu || 0), 0)
  return Math.round(total / online.length)
})

// ==================== 加载数据 ====================
const loadInitialData = async () => {
  loading.value = true
  try {
    const [overview, trend, serverList] = await Promise.all([
      httpClient.get('/dashboard/overview'),
      httpClient.get('/metrics/trend?days=7'),
      httpClient.get('/servers')
    ])
    metrics.value = overview.metrics || {
      onlinePlayers: 0,
      revenue: 0,
      activeServers: 0,
      latency: 0
    }
    servers.value = serverList || []
    // 将后端 { labels, dauData, revenueData } 转为 LineChart 期望的 { labels, datasets }
    if (trend && trend.labels) {
      trendData.value = {
        labels: trend.labels,
        datasets: [{ name: '在线玩家', data: trend.dauData || [] }]
      }
    } else {
      trendData.value = { labels: [], datasets: [] }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// ==================== WebSocket 实时更新 ====================
const handleGameData = (data, serverData) => {
  if (data) {
    metrics.value = data
  }
  if (serverData) {
    servers.value = serverData
  }
  wsLatency.value = websocket.latency
}

// ==================== 告警通知：防抖去重 + 右上角单条显示 ====================
const lastAlertKey = ref('')
let alertTimer = null
let currentNotification = null

const handleAlert = (alert) => {
  if (!alert) return

  // 加入告警列表
  alerts.value.unshift({
    ...alert,
    id: Date.now(),
    time: new Date().toLocaleString()
  })
  if (alerts.value.length > 50) {
    alerts.value.pop()
  }

  // 去重：同服务器+同指标 10s 内只弹一次
  const key = `${alert.server || ''}_${alert.message || ''}`
  if (key === lastAlertKey.value) return
  lastAlertKey.value = key
  setTimeout(() => {
    lastAlertKey.value = ''
  }, 10000)

  // 关闭上一条通知，只保留最新
  if (currentNotification) {
    currentNotification.close()
    currentNotification = null
  }

  const type = alert.level === 'critical' ? 'error' : 'warning'
  const label = alert.level === 'critical' ? '紧急' : '告警'

  currentNotification = ElNotification({
    title: `【${label}】${alert.server || ''}`,
    message: alert.message || '',
    type: type,
    duration: 5000,
    offset: 40,
    position: 'bottom-right',
    customClass: 'alert-notify',
    onClose: () => {
      currentNotification = null
    }
  })
}

// ==================== 仪表盘下钻导航 ====================
const goRealtime = () => router.push('/realtime')
const goAnalytics = () => router.push('/analytics')
const goAlerts = () => router.push('/alerts')
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  })
    .then(() => {
      localStorage.clear()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {})
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadInitialData()
  websocket.connect()
  websocket.on('gameData', handleGameData)
  websocket.on('alert', handleAlert)
})

onUnmounted(() => {
  websocket.off('gameData', handleGameData)
  websocket.off('alert', handleAlert)
  // 不断开全局 WebSocket，其他页面仍需使用
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  min-height: 100vh;
  background: #f5f5f5;
  color: #111827;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  font-size: 22px;
  margin: 0;
  background: linear-gradient(135deg, #74b9ff, #a29bfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.version {
  font-size: 12px;
  color: #6b7280;
  background: rgba(138, 155, 178, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
}

/* WebSocket 延迟指示器 */
.ws-latency {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  transition:
    background 0.3s,
    color 0.3s;
}

.latency-good {
  background: rgba(0, 184, 148, 0.15);
  color: #00b894;
  border: 1px solid rgba(0, 184, 148, 0.3);
}

.latency-normal {
  background: rgba(253, 203, 110, 0.15);
  color: #fdcb6e;
  border: 1px solid rgba(253, 203, 110, 0.3);
}

.latency-slow {
  background: rgba(225, 112, 85, 0.15);
  color: #e17055;
  border: 1px solid rgba(225, 112, 85, 0.3);
}

.latency-bad {
  background: rgba(214, 48, 49, 0.2);
  color: #d63031;
  border: 1px solid rgba(214, 48, 49, 0.4);
  animation: latency-blink 1s infinite;
}

@keyframes latency-blink {
  50% {
    opacity: 0.5;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-text {
  color: #6b7280;
  font-size: 14px;
}

.role-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.role-tag.admin {
  background: rgba(225, 112, 85, 0.2);
  color: #e17055;
  border: 1px solid rgba(225, 112, 85, 0.3);
}

.role-tag.operator {
  background: rgba(0, 184, 148, 0.2);
  color: #00b894;
  border: 1px solid rgba(0, 184, 148, 0.3);
}

.role-tag.developer {
  background: rgba(253, 203, 110, 0.2);
  color: #fdcb6e;
  border: 1px solid rgba(253, 203, 110, 0.3);
}

.role-tag.viewer {
  background: rgba(138, 155, 178, 0.2);
  color: #6b7280;
  border: 1px solid rgba(138, 155, 178, 0.3);
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
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .charts-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

/* 仪表盘下钻：可点击区域 */
.card-drill {
  cursor: pointer;
  border-radius: 12px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.card-drill:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(116, 185, 255, 0.15);
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
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

  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}
</style>

<!-- 告警通知紧凑样式（非 scoped，ElNotification 渲染在组件外） -->
<style>
.alert-notify {
  padding: 10px 16px !important;
  max-width: 360px !important;
}
.alert-notify .el-notification__title {
  font-size: 13px !important;
  margin-bottom: 2px !important;
  line-height: 1.3 !important;
}
.alert-notify .el-notification__content {
  font-size: 12px !important;
  margin: 0 !important;
  line-height: 1.3 !important;
}
.alert-notify .el-notification__closeBtn {
  top: 8px !important;
  right: 10px !important;
}
</style>
