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
        <span class="role-tag" :class="userRole">{{ roleName }}</span>
        <el-button type="danger" size="small" @click="logout" :icon="SwitchButton">
          退出登录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <StatsCard 
        title="在线玩家" 
        :value="metrics.onlinePlayers || 0" 
        trend="up"
        subtitle="当前在线人数"
      />
      <StatsCard 
        title="今日收入" 
        :value="metrics.revenue || 0" 
        format="currency"
        trend="up"
        subtitle="截至现在"
      />
      <StatsCard 
        title="活跃服务器" 
        :value="activeServersCount" 
        subtitle="当前在线服务器"
      />
      <StatsCard 
        title="平均延迟" 
        :value="metrics.avgLatency || 0" 
        trend="down"
        subtitle="实时延迟"
        unit="ms"
      />
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <LineChart 
        title="在线玩家趋势" 
        :data="trendData"
      />
      <GaugeChart 
        title="服务器负载" 
        :value="avgCpuLoad"
        :max="100"
        unit="%"
      />
    </div>

    <!-- 服务器状态和告警 -->
    <div class="bottom-grid">
      <ServerStatusCard :servers="servers" />
      <AlertCard :alerts="alerts" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
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
const metrics = ref({ onlinePlayers: 0, revenue: 0, activeServers: 0, avgLatency: 0 })
const servers = ref([])
const alerts = ref([])
const trendData = ref({ labels: [], dauData: [], revenueData: [] })
const loading = ref(false)

// ==================== 用户信息 ====================
const userName = computed(() => localStorage.getItem('userName') || '管理员')
const userRole = computed(() => localStorage.getItem('userRole') || 'admin')
const roleName = computed(() => {
    const map = { admin: '管理员', operator: '运营人员', developer: '开发人员', viewer: '观察员' }
    return map[userRole.value] || '管理员'
})

// ==================== 计算属性 ====================
const activeServersCount = computed(() => {
    return servers.value.filter(s => s.status === 'online').length
})

const avgCpuLoad = computed(() => {
    const online = servers.value.filter(s => s.status === 'online')
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
        metrics.value = overview.metrics || { onlinePlayers: 0, revenue: 0, activeServers: 0, avgLatency: 0 }
        servers.value = serverList || []
        trendData.value = trend || { labels: [], dauData: [], revenueData: [] }
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
}

const handleAlert = (alert) => {
    if (alert) {
        alerts.value.unshift({
            ...alert,
            id: Date.now(),
            time: new Date().toLocaleString()
        })
        if (alerts.value.length > 50) {
            alerts.value.pop()
        }
        ElMessage.warning(`【${alert.level === 'critical' ? '紧急' : alert.level === 'warning' ? '警告' : '信息'}】${alert.message}`)
    }
}

// ==================== 退出登录 ====================
const logout = () => {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
    }).then(() => {
        localStorage.clear()
        ElMessage.success('已退出登录')
        router.push('/login')
    }).catch(() => {})
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
    websocket.disconnect()
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
    background: #16213e;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
    background: linear-gradient(135deg, #74b9ff, #a29bfe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.version {
    font-size: 12px;
    color: #8a9bb2;
    background: rgba(138, 155, 178, 0.1);
    padding: 4px 10px;
    border-radius: 20px;
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
    color: #8a9bb2;
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