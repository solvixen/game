<template>
  <BaseCard title="服务器状态">
    <div class="server-list">
      <div v-for="server in servers" :key="server.id" class="server-item">
        <div class="server-info">
          <span class="server-name">{{ server.name }}</span>
          <span class="server-region">{{ server.region }}</span>
        </div>
        <div class="server-status">
          <span class="status-badge" :class="server.status">
            {{ server.status === 'online' ? '在线' : '离线' }}
          </span>
          <span class="player-count">{{ server.players }}人</span>
        </div>
        <div class="server-metrics">
          <div class="metric">
            <span class="metric-label">CPU</span>
            <el-progress 
              :percentage="server.cpu" 
              :color="cpuColor(server.cpu)"
              :stroke-width="8"
            />
          </div>
          <div class="metric">
            <span class="metric-label">内存</span>
            <el-progress 
              :percentage="server.memory" 
              :color="memoryColor(server.memory)"
              :stroke-width="8"
            />
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../common/BaseCard.vue'

defineProps({
  servers: {
    type: Array,
    required: true
  }
})

const cpuColor = (value) => {
  if (value < 60) return '#00b894'
  if (value < 80) return '#fdcb6e'
  return '#e17055'
}

const memoryColor = (value) => {
  if (value < 70) return '#00b894'
  if (value < 85) return '#fdcb6e'
  return '#e17055'
}
</script>

<style scoped>
.server-list {
  max-height: 400px;
  overflow-y: auto;
}

.server-item {
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.server-item:last-child {
  border-bottom: none;
}

.server-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.server-name {
  font-weight: 600;
}

.server-region {
  color: #8a9bb2;
  font-size: 12px;
}

.server-status {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.online {
  background: rgba(0, 184, 148, 0.2);
  color: #00b894;
}

.status-badge.offline {
  background: rgba(225, 112, 85, 0.2);
  color: #e17055;
}

.player-count {
  font-size: 14px;
  color: #8a9bb2;
}

.metric {
  margin-bottom: 8px;
}

.metric-label {
  display: inline-block;
  width: 40px;
  font-size: 12px;
  color: #8a9bb2;
}
</style>