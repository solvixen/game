<template>
  <div class="analytics">
    <h1 class="page-title">数据分析</h1>
    
    <!-- 时间筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="timeRange" size="large">
        <el-radio-button label="today">今日</el-radio-button>
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="quarter">本季度</el-radio-button>
      </el-radio-group>
      
      <el-date-picker
        v-model="customRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :disabled="timeRange !== 'custom'"
      />
    </div>

    <!-- 关键指标卡片 -->
    <div class="stats-grid">
      <BaseCard v-for="stat in stats" :key="stat.title" class="stat-card">
        <div class="stat-label">{{ stat.title }}</div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-compare">
          较上期 {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}%
          <span :class="stat.change >= 0 ? 'up' : 'down'">
            {{ stat.change >= 0 ? '↑' : '↓' }}
          </span>
        </div>
      </BaseCard>
    </div>

    <!-- 图表分析 -->
    <div class="charts-section">
      <LineChart 
        title="DAU趋势" 
        :data="dauData"
      />
      
      <div class="charts-row">
        <LineChart 
          title="收入趋势" 
          :data="revenueData"
        />
        <LineChart 
          title="留存率分析" 
          :data="retentionData"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <BaseCard title="详细数据">
      <el-table :data="tableData" style="width: 100%" stripe>
        <el-table-column prop="date" label="日期" width="180" />
        <el-table-column prop="dau" label="DAU" />
        <el-table-column prop="mau" label="MAU" />
        <el-table-column prop="newUsers" label="新增用户" />
        <el-table-column prop="revenue" label="收入(元)" />
        <el-table-column prop="avgDuration" label="平均时长(分钟)" />
      </el-table>
      
      <div class="table-footer">
        <el-button type="primary" @click="exportData">导出数据</el-button>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'

const timeRange = ref('week')
const customRange = ref([])

// 模拟统计数据
const stats = ref([
  { title: 'DAU', value: '12,345', change: 8.5 },
  { title: 'MAU', value: '45,678', change: 12.3 },
  { title: 'ARPU', value: '¥25.6', change: 5.2 },
  { title: '付费率', value: '15.8%', change: -2.1 }
])

// 模拟图表数据
const dauData = computed(() => ({
  labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  datasets: [{
    name: 'DAU',
    data: [12345, 13456, 14567, 15678, 16789, 17890, 18901]
  }]
}))

const revenueData = computed(() => ({
  labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  datasets: [{
    name: '收入',
    data: [34567, 37890, 41234, 44567, 47890, 51234, 54567]
  }]
}))

const retentionData = computed(() => ({
  labels: ['次日', '3日', '7日', '14日', '30日'],
  datasets: [{
    name: '留存率',
    data: [45, 32, 23, 18, 12]
  }]
}))

// 模拟表格数据
const tableData = ref([
  { date: '2026-03-11', dau: 12345, mau: 45678, newUsers: 1234, revenue: 34567, avgDuration: 45 },
  { date: '2026-03-12', dau: 13456, mau: 46789, newUsers: 1345, revenue: 37890, avgDuration: 47 },
  { date: '2026-03-13', dau: 14567, mau: 47890, newUsers: 1456, revenue: 41234, avgDuration: 48 },
  { date: '2026-03-14', dau: 15678, mau: 48901, newUsers: 1567, revenue: 44567, avgDuration: 52 },
  { date: '2026-03-15', dau: 16789, mau: 49912, newUsers: 1678, revenue: 47890, avgDuration: 55 }
])

const exportData = () => {
  console.log('导出数据', timeRange.value)
  // 实际导出逻辑
}

watch(timeRange, (newVal) => {
  console.log('时间范围变化:', newVal)
  // 重新加载数据
})
</script>

<style scoped>
.analytics {
  padding: 24px;
  min-height: 100vh;
  background: #1a1a2e;
  color: #fff;
}

.page-title {
  font-size: 24px;
  margin: 0 0 24px 0;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #16213e;
  border-radius: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  color: #8a9bb2;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #74b9ff;
  margin-bottom: 8px;
}

.stat-compare {
  font-size: 12px;
  color: #8a9bb2;
}

.stat-compare .up {
  color: #00b894;
}

.stat-compare .down {
  color: #e17055;
}

.charts-section {
  margin-bottom: 24px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.table-footer {
  margin-top: 20px;
  text-align: right;
}
</style>