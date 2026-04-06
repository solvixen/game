<template>
  <div class="gauge-chart">
    <div class="chart-header" v-if="title">
      <h3>{{ title }}</h3>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  value: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  unit: {
    type: String,
    default: '%'
  },
  min: {
    type: Number,
    default: 0
  }
})

const chartRef = ref(null)
let chart = null

const initChart = () => {
  if (!chartRef.value) return
  
  // 销毁旧实例
  if (chart) {
    chart.dispose()
  }
  
  chart = echarts.init(chartRef.value)
  
  const option = {
    series: [{
      type: 'gauge',
      center: ['50%', '55%'],
      radius: '80%',
      startAngle: 210,
      endAngle: -30,
      min: props.min,
      max: props.max,
      splitNumber: 5,
      progress: {
        show: true,
        width: 15,
        roundCap: true,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#00b894' },
              { offset: 0.5, color: '#fdcb6e' },
              { offset: 1, color: '#e17055' }
            ]
          }
        }
      },
      axisLine: {
        lineStyle: {
          width: 15,
          color: [
            [0.3, '#00b894'],
            [0.7, '#fdcb6e'],
            [1, '#e17055']
          ]
        }
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 20,
        color: '#fff',
        offsetCenter: [0, '20%'],
        formatter: `{value} ${props.unit}`
      },
      data: [{ value: props.value || 0 }]
    }]
  }
  
  chart.setOption(option)
}

onMounted(() => {
  setTimeout(() => {
    initChart()
  }, 100)
  
  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

watch(() => props.value, (newVal) => {
  if (chart) {
    chart.setOption({
      series: [{
        data: [{ value: newVal || 0 }]
      }]
    })
  }
}, { immediate: true })

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.gauge-chart {
  background: #16213e;
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.chart-header {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #8a9bb2;
  margin: 0;
}

.chart-container {
  width: 100%;
  height: 220px;
}
</style>