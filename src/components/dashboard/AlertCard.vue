<template>
  <BaseCard title="实时告警">
    <div class="alert-list">
      <el-empty v-if="!alerts.length" description="暂无告警" />
      <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.level">
        <div class="alert-header">
          <span class="alert-type">{{ alert.type }}</span>
          <span class="alert-time">{{ formatTime(alert.time) }}</span>
        </div>
        <div class="alert-message">{{ alert.message }}</div>
        <div class="alert-value">
          当前值: {{ alert.value }} {{ alert.unit }}
          <span v-if="alert.threshold">(阈值: {{ alert.threshold }})</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../common/BaseCard.vue'
import dayjs from 'dayjs'

defineProps({
  alerts: {
    type: Array,
    default: () => []
  }
})

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('HH:mm:ss')
}
</script>

<style scoped>
.alert-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
}

.alert-item:last-child {
  margin-bottom: 0;
}

.alert-item.critical {
  border-left: 3px solid #e17055;
}

.alert-item.warning {
  border-left: 3px solid #fdcb6e;
}

.alert-item.info {
  border-left: 3px solid #74b9ff;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.alert-type {
  font-size: 12px;
  font-weight: 600;
  color: #8a9bb2;
}

.alert-time {
  font-size: 11px;
  color: #6c7983;
}

.alert-message {
  font-size: 14px;
  margin-bottom: 5px;
}

.alert-value {
  font-size: 12px;
  color: #8a9bb2;
}
</style>