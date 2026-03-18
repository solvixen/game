<template>
  <div class="line-chart">
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
  data: {
    type: Object,
    required: true,
    default: () => ({
      labels: [],
      datasets: []
    })
  }
})

const chartRef = ref(null)
let chart = null

const initChart = () => {
  if (!chartRef.value) return
  
  if (chart) {
    chart.dispose()
  }
  
  chart = echarts.init(chartRef.value)
  
  const labels = props.data?.labels || []
  const datasets = props.data?.datasets || []
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#4a4a6a' } },
      axisLabel: { color: '#8a9bb2', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#4a4a6a' } },
      axisLabel: { color: '#8a9bb2', fontSize: 11 },
      splitLine: { 
        lineStyle: { color: '#2a2a3e', type: 'dashed' } 
      }
    },
    series: datasets.map((dataset, index) => ({
      name: dataset.name || '数据',
      type: 'line',
      data: dataset.data || [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { 
        width: 2,
        color: index === 0 ? '#74b9ff' : index === 1 ? '#00b894' : '#e17055'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(116, 185, 255, 0.3)' },
          { offset: 1, color: 'rgba(116, 185, 255, 0.05)' }
        ])
      }
    }))
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

watch(() => props.data, () => {
  if (chart) {
    const labels = props.data?.labels || []
    const datasets = props.data?.datasets || []
    
    chart.setOption({
      xAxis: { data: labels },
      series: datasets.map((dataset, index) => ({
        data: dataset.data || []
      }))
    })
  }
}, { deep: true, immediate: true })

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.line-chart {
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
  height: 250px;
}
</style>