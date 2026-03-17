<template>
  <BaseCard :title="title">
    <div ref="chartRef" class="chart-container"></div>
  </BaseCard>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import BaseCard from '../common/BaseCard.vue'

const props = defineProps({
  title: String,
  data: {
    type: Object,
    required: true
  },
  colors: {
    type: Array,
    default: () => ['#74b9ff', '#00b894', '#e17055']
  }
})

const chartRef = ref(null)
let chart = null

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: {c}'
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
      data: props.data.labels || [],
      axisLine: { lineStyle: { color: '#4a4a6a' } },
      axisLabel: { color: '#8a9bb2' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#4a4a6a' } },
      axisLabel: { color: '#8a9bb2' },
      splitLine: { lineStyle: { color: '#2a2a3e', type: 'dashed' } }
    },
    series: (props.data.datasets || []).map((dataset, index) => ({
      ...dataset,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: props.colors[index % props.colors.length] + '40' },
          { offset: 1, color: 'rgba(0,0,0,0)' }
        ])
      }
    }))
  }
  
  chart.setOption(option)
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

watch(() => props.data, () => {
  chart?.setOption({
    xAxis: { data: props.data.labels },
    series: props.data.datasets
  })
}, { deep: true })
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
}
</style>