<template>
  <div class="dashboard">
    <!-- 头部统计卡片 -->
    <div class="stats-grid">
      <StatsCard 
        title="在线玩家" 
        :value="store.onlinePlayers" 
        trend="up"
        subtitle="当前在线人数"
        :change="12.5"
      />
      <StatsCard 
        title="今日收入" 
        :value="store.revenue" 
        format="currency"
        trend="up"
        subtitle="截至现在"
        :change="8.3"
      />
      <StatsCard 
        title="活跃服务器" 
        :value="store.activeServers" 
        :change="0"
        subtitle="总共8台服务器"
      />
      <StatsCard 
        title="平均延迟" 
        value="45" 
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

    <!-- 服务器状态和告警 -->
    <div class="bottom-grid">
      <ServerStatusCard :servers="store.servers" />
      <AlertCard :alerts="store.alerts" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useGameDataStore } from '@/store'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import ServerStatusCard from '@/components/dashboard/ServerStatusCard.vue'
import AlertCard from '@/components/dashboard/AlertCard.vue'

const store = useGameDataStore()

// 模拟图表数据
const playerTrendData = computed(() => ({
  labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
  datasets: [{
    name: '在线玩家',
    data: store.historyData.map(d => d.players).slice(-24)
  }]
}))

const serverLoad = computed(() => {
  if (!store.servers.length) return 0
  const avg = store.servers.reduce((sum, s) => sum + s.cpu, 0) / store.servers.length
  return Math.round(avg)
})

onMounted(() => {
  store.fetchServerStatus()
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  min-height: 100vh;
  background: #1a1a2e;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 1024px) {
  .charts-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>