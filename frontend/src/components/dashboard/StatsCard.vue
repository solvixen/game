<template>
  <div class="stats-card" :class="{ 'hoverable': hoverable }">
    <div class="stats-header">
      <h3>{{ title }}</h3>
      <slot name="header"></slot>
    </div>
    <div class="stats-content">
      <div class="stats-value" :class="trend">
        {{ formattedValue }}
        <span v-if="trend" class="trend-icon">
          {{ trend === 'up' ? '↑' : '↓' }}
        </span>
      </div>
      <div v-if="subtitle" class="stats-subtitle">{{ subtitle }}</div>
      <div v-if="change" class="stats-change">
        {{ change > 0 ? '+' : '' }}{{ change }}% 较昨日
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  format: {
    type: String,
    default: 'number'
  },
  trend: {
    type: String,
    default: '',
    validator: (v) => ['', 'up', 'down', 'stable'].includes(v)
  },
  subtitle: String,
  change: Number,
  hoverable: {
    type: Boolean,
    default: true
  }
})

const formattedValue = computed(() => {
  if (props.format === 'number') {
    return new Intl.NumberFormat().format(props.value)
  }
  if (props.format === 'currency') {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(props.value)
  }
  return props.value
})
</script>

<style scoped>
.stats-card {
  background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(116, 185, 255, 0.3);
}

.stats-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #8a9bb2;
  margin: 0;
}

.stats-content {
  text-align: center;
}

.stats-value {
  font-size: 32px;
  font-weight: 700;
  margin: 10px 0;
  line-height: 1.2;
}

.stats-value.up {
  color: #00b894;
}

.stats-value.down {
  color: #e17055;
}

.stats-value.stable {
  color: #74b9ff;
}

.trend-icon {
  font-size: 20px;
  margin-left: 5px;
  opacity: 0.8;
}

.stats-subtitle {
  font-size: 13px;
  color: #8a9bb2;
  margin-top: 5px;
}

.stats-change {
  font-size: 12px;
  color: #6c7983;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}
</style>