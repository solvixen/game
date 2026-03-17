<template>
  <BaseCard :title="title">
    <div ref="chartRef" class="chart-container"></div>
  </BaseCard>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import BaseCard from '../common/BaseCard.vue'

const props = defineProps({
  title: String,
  dataStream: {
    type: Function,
    required: true
  },
  maxPoints: {
    type: Number,
    default: 60
  }
})

const chartRef = ref(null)
let chart = null
let timer = null
const data = ref([])

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  
  const option = {
    tooltip: { trigger: 'axis' },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      axisLine: { lineStyle: { color: '#4a4a6a' } },
      axisLabel: { color: '#8a9bb2' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#4a4a6a' } },
      axisLabel: { color: '#8a9bb2' },
      splitLine: { lineStyle: { color: '#2a2a3e' } }
    },
    series: [{
      data: [],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#74b9ff', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(116, 185, 255, 0.3)' },
          { offset: 1, color: 'rgba(116, 185, 255, 0.05)' }
        ])
      }
    }]
  }
  
  chart.setOption(option)
  startUpdate()
}

const startUpdate = () => {
  timer = setInterval(() => {
    const newValue = props.dataStream()
    const time = new Date().toLocaleTimeString()
    
    data.value.push({ time, value: newValue })
    
    if (data.value.length > props.maxPoints) {
      data.value.shift()
    }
    
    chart.setOption({
      xAxis: { data: data.value.map(d => d.time) },
      series: [{ data: data.value.map(d => d.value) }]
    })
  }, 1000)
}

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  chart?.dispose()
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
}
</style>