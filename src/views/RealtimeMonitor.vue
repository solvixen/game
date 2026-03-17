<template>
  <div class="realtime-monitor">
    <div class="header">
      <h1>实时监控</h1>
      <div class="connection-status">
        <span class="status-dot" :class="{ connected: isConnected }"></span>
        {{ isConnected ? '已连接' : '连接中...' }}
      </div>
    </div>

    <!-- 实时数据流 -->
    <div class="realtime-grid">
      <RealtimeChart 
        title="实时在线玩家"
        :data-stream="() => Math.floor(Math.random() * 1000 + 3000)"
        :max-points="60"
      />
      
      <div class="metrics-panel">
        <BaseCard title="实时指标">
          <div class="metric-list">
            <div class="metric-item">
              <span class="label">当前在线</span>
              <span class="value">{{ realtimeData.onlinePlayers }}</span>
            </div>
            <div class="metric-item">
              <span class="label">今日新增</span>
              <span class="value">{{ realtimeData.newPlayers }}</span>
            </div>
            <div class="metric-item">
              <span class="label">实时收入</span>
              <span class="value">¥{{ realtimeData.revenue }}</span>
            </div>
            <div class="metric-item">
              <span class="label">平均延迟</span>
              <span class="value">{{ realtimeData.latency }}ms</span>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- 服务器实时状态 -->
    <BaseCard title="服务器实时状态">
      <el-table :data="store.servers" style="width: 100%" stripe>
        <el-table-column prop="name" label="服务器名称" />
        <el-table-column prop="region" label="区域" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="players" label="玩家数" />
        <el-table-column label="CPU">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.cpu" 
              :color="cpuColor(row.cpu)"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column label="内存">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.memory" 
              :color="memoryColor(row.memory)"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column prop="latency" label="延迟(ms)" />
      </el-table>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameDataStore } from '@/store'
import { useWebSocket } from '@/composables/useWebSocket'
import BaseCard from '@/components/common/BaseCard.vue'
import RealtimeChart from '@/components/charts/RealtimeChart.vue'

const store = useGameDataStore()
const { isConnected, lastMessage } = useWebSocket('gameData', handleNewData)

const realtimeData = ref({
  onlinePlayers: 0,
  newPlayers: 0,
  revenue: 0,
  latency: 0
})

function handleNewData(data) {
  realtimeData.value = {
    ...realtimeData.value,
    ...data
  }
}

const cpuColor = (value) => {
  if (value < 60) return '#67c23a'
  if (value < 80) return '#e6a23c'
  return '#f56c6c'
}

const memoryColor = (value) => {
  if (value < 70) return '#67c23a'
  if (value < 85) return '#e6a23c'
  return '#f56c6c'
}

onMounted(() => {
  store.fetchServerStatus()
})
</script>

<style scoped>
.realtime-monitor {
  padding: 24px;
  min-height: 100vh;
  background: #1a1a2e;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 24px;
  margin: 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #16213e;
  border-radius: 20px;
  font-size: 14px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f56c6c;
  animation: pulse 1.5s infinite;
}

.status-dot.connected {
  background: #67c23a;
  animation: none;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

.realtime-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.metric-list {
  padding: 16px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-item .label {
  color: #8a9bb2;
}

.metric-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #74b9ff;
}
</style>