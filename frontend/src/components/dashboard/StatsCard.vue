<template>
  <div class="stats-card" :class="[themeClass, { 'hoverable': hoverable }]">
    <div class="stats-header">
      <div class="stats-icon">
        <span>{{ icon }}</span>
      </div>
      <h3>{{ title }}</h3>
    </div>
    <div class="stats-content">
      <div class="stats-value" :class="trend">
        {{ formattedValue }}
        <span v-if="trend && trend !== 'stable'" class="trend-icon">
          {{ trend === 'up' ? '↑' : '↓' }}
        </span>
      </div>
      <div v-if="subtitle" class="stats-subtitle">{{ subtitle }}</div>
      <div v-if="change" class="stats-change" :class="{ positive: change > 0, negative: change < 0 }">
        {{ change > 0 ? '+' : '' }}{{ change }}% 较昨日
      </div>
    </div>
    <!-- 底部装饰线 -->
    <div class="stats-decoration"></div>
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
  },
  theme: {
    type: String,
    default: 'blue',
    validator: (v) => ['blue', 'gold', 'green', 'orange'].includes(v)
  }
})

const themeConfig = {
  blue: {
    gradient: 'linear-gradient(135deg, #16213e 0%, #1a3a5c 100%)',
    borderColor: 'rgba(116, 185, 255, 0.15)',
    hoverBorder: 'rgba(116, 185, 255, 0.4)',
    valueColor: '#74b9ff',
    decoColor: 'linear-gradient(90deg, #74b9ff, transparent)',
    iconBg: 'rgba(116, 185, 255, 0.15)',
    iconColor: '#74b9ff',
    icon: '👥'
  },
  gold: {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d2417 100%)',
    borderColor: 'rgba(253, 203, 110, 0.15)',
    hoverBorder: 'rgba(253, 203, 110, 0.4)',
    valueColor: '#fdcb6e',
    decoColor: 'linear-gradient(90deg, #fdcb6e, transparent)',
    iconBg: 'rgba(253, 203, 110, 0.15)',
    iconColor: '#fdcb6e',
    icon: '💰'
  },
  green: {
    gradient: 'linear-gradient(135deg, #16213e 0%, #162e23 100%)',
    borderColor: 'rgba(0, 184, 148, 0.15)',
    hoverBorder: 'rgba(0, 184, 148, 0.4)',
    valueColor: '#00b894',
    decoColor: 'linear-gradient(90deg, #00b894, transparent)',
    iconBg: 'rgba(0, 184, 148, 0.15)',
    iconColor: '#00b894',
    icon: '🖥️'
  },
  orange: {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2e1f16 100%)',
    borderColor: 'rgba(225, 112, 85, 0.15)',
    hoverBorder: 'rgba(225, 112, 85, 0.4)',
    valueColor: '#e17055',
    decoColor: 'linear-gradient(90deg, #e17055, transparent)',
    iconBg: 'rgba(225, 112, 85, 0.15)',
    iconColor: '#e17055',
    icon: '⚡'
  }
}

const config = computed(() => themeConfig[props.theme] || themeConfig.blue)
const themeClass = computed(() => `theme-${props.theme}`)
const icon = computed(() => config.value.icon)

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
  background: v-bind('config.gradient');
  border-radius: 14px;
  padding: 20px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  border: 1px solid v-bind('config.borderColor');
  position: relative;
  overflow: hidden;
}

.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  border-color: v-bind('config.hoverBorder');
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.stats-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: v-bind('config.iconBg');
  font-size: 16px;
  flex-shrink: 0;
}

.stats-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: #8a9bb2;
  margin: 0;
}

.stats-content {
  text-align: left;
}

.stats-value {
  font-size: 30px;
  font-weight: 700;
  margin: 6px 0;
  line-height: 1.2;
  color: v-bind('config.valueColor');
}

.stats-value.up {
  color: #00b894;
}

.stats-value.down {
  color: #e17055;
}

.trend-icon {
  font-size: 18px;
  margin-left: 5px;
  opacity: 0.8;
}

.stats-subtitle {
  font-size: 13px;
  color: #6c7a8a;
  margin-top: 4px;
}

.stats-change {
  font-size: 12px;
  color: #6c7a8a;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}

.stats-change.positive {
  color: #00b894;
}

.stats-change.negative {
  color: #e17055;
}

.stats-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: v-bind('config.decoColor');
  opacity: 0;
  transition: opacity 0.3s;
}

.stats-card:hover .stats-decoration {
  opacity: 1;
}
</style>
