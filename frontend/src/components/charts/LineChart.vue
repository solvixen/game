<template>
  <div class="line-chart">
    <div v-if="title" class="chart-header">
      <h3>{{ title }}</h3>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { init, graphic } from '@/utils/echarts'

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

  chart = init(chartRef.value)

  const labels = props.data?.labels || []
  const datasets = props.data?.datasets || []

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: { backgroundColor: '#ffffff' }
      },
      backgroundColor: '#ffffff',
      borderColor: '#1a56db',
      textStyle: { color: '#111827' }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#d1d5db' } },
      axisLabel: { color: '#6b7280', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#d1d5db' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: {
        lineStyle: { color: '#e5e7eb', type: 'dashed' }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
        zoomOnMouseWheel: true
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 20,
        bottom: 5,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        fillerColor: 'rgba(26,86,219,0.1)',
        handleStyle: { color: '#1a56db' },
        textStyle: { color: '#6b7280' }
      }
    ],
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
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(26,86,219,0.15)' },
          { offset: 1, color: 'rgba(26,86,219,0.02)' }
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

watch(
  () => props.data,
  () => {
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
  },
  { deep: true, immediate: true }
)

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
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  border: 1px solid #e5e7eb;
}

.chart-header {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border: 1px solid #d1d5db;
}

.chart-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
}

.chart-container {
  width: 100%;
  height: 250px;
}
</style>
