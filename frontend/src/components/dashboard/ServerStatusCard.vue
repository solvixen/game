<template>
  <div class="server-status-card">
    <div class="card-header">
      <h3>服务器状态</h3>
      <span class="server-count">{{ onlineCount }}/{{ totalCount }} 在线</span>
    </div>
    
    <div class="server-list">
      <div v-for="server in servers" :key="server.id" class="server-item">
        <div class="server-info">
          <div class="server-name">
            {{ server.name }}
            <span class="server-region">{{ server.region }}</span>
          </div>
          <div class="server-status">
            <span class="status-dot" :class="server.status"></span>
            <span>{{ server.status === 'online' ? '在线' : '离线' }}</span>
          </div>
        </div>
        
        <div v-if="server.status === 'online'" class="server-metrics">
          <div class="metric">
            <span class="metric-label">👥 {{ server.players }}</span>
            <el-progress 
              :percentage="server.cpu" 
              :color="cpuColor(server.cpu)"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
          <div class="metric-details">
            <span>CPU: {{ server.cpu }}%</span>
            <span>内存: {{ server.memory }}%</span>
            <span>延迟: {{ server.latency }}ms</span>
          </div>
        </div>
        
        <div v-else class="offline-message">
          服务器当前不可用
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  servers: {
    type: Array,
    default: () => []
  }
})

const onlineCount = computed(() => {
  return props.servers.filter(s => s.status === 'online').length
})

const totalCount = computed(() => {
  return props.servers.length
})

const cpuColor = (value) => {
  if (value < 60) return '#00b894'
  if (value < 80) return '#fdcb6e'
  return '#e17055'
}
</script>

<style scoped>
.server-status-card {
  background: #16213e;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #8a9bb2;
  margin: 0;
}

.server-count {
  font-size: 12px;
  color: #00b894;
  background: rgba(0, 184, 148, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.server-list {
  max-height: 350px;
  overflow-y: auto;
}

.server-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.server-item:last-child {
  border-bottom: none;
}

.server-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.server-name {
  font-weight: 500;
  font-size: 14px;
}

.server-region {
  font-size: 11px;
  color: #8a9bb2;
  margin-left: 8px;
  background: rgba(138, 155, 178, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #00b894;
  box-shadow: 0 0 8px rgba(0, 184, 148, 0.5);
}

.status-dot.offline {
  background: #e17055;
}

.metric {
  margin-bottom: 4px;
}

.metric-label {
  font-size: 12px;
  color: #8a9bb2;
  display: block;
  margin-bottom: 2px;
}

.metric-details {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #8a9bb2;
  margin-top: 4px;
}

.offline-message {
  color: #e17055;
  font-size: 12px;
  padding: 8px 0;
  text-align: center;
  background: rgba(225, 112, 85, 0.1);
  border-radius: 4px;
}
</style>