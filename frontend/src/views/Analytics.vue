<template>
  <div class="analytics">
    <h1 class="page-title">📊 数据分析</h1>
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="left">
        <el-radio-group v-model="timeRange" size="large" @change="handleTimeRangeChange">
          <el-radio-button value="today">今日</el-radio-button>
          <el-radio-button value="week">本周</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
          <el-radio-button value="quarter">本季度</el-radio-button>
        </el-radio-group>
        
        <el-date-picker
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :disabled="timeRange !== 'custom'"
          @change="handleCustomRangeChange"
        />
      </div>
      
      <div class="right">
        <!-- 导出按钮组 -->
        <el-dropdown @command="handleExport">
          <el-button type="primary" :icon="Download">
            导出数据 <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="excel">📊 导出 Excel</el-dropdown-item>
              <el-dropdown-item command="csv">📄 导出 CSV</el-dropdown-item>
              <el-dropdown-item command="pdf">📑 导出 PDF</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <el-button @click="refreshData" :icon="Refresh">
          刷新
        </el-button>
      </div>
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
      <!-- 表格工具栏 -->
      <div class="table-toolbar">
        <div class="left">
          <el-button 
            type="danger" 
            size="small" 
            :disabled="!selectedRows.length"
            @click="deleteSelected"
          >
            批量删除
          </el-button>
          <span class="selected-info" v-if="selectedRows.length">
            已选择 {{ selectedRows.length }} 项
          </span>
        </div>
        
        <div class="right">
          <el-button 
            v-if="selectedRows.length"
            size="small"
            @click="exportSelected"
          >
            导出选中项
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        stripe
        ref="tableRef"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="date" label="日期" width="120" sortable />
        <el-table-column prop="dau" label="DAU" sortable>
          <template #default="{ row }">
            {{ formatNumber(row.dau) }}
          </template>
        </el-table-column>
        <el-table-column prop="mau" label="MAU" sortable>
          <template #default="{ row }">
            {{ formatNumber(row.mau) }}
          </template>
        </el-table-column>
        <el-table-column prop="newUsers" label="新增用户" sortable>
          <template #default="{ row }">
            {{ formatNumber(row.newUsers) }}
          </template>
        </el-table-column>
        <el-table-column prop="revenue" label="收入(元)" sortable>
          <template #default="{ row }">
            ¥{{ formatNumber(row.revenue) }}
          </template>
        </el-table-column>
        <el-table-column prop="avgDuration" label="平均时长(分钟)" sortable />
        <el-table-column prop="payRate" label="付费率" sortable>
          <template #default="{ row }">
            {{ row.payRate }}%
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="table-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </BaseCard>

    <!-- 导出选项对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出选项" width="400px">
      <el-form label-width="100px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio label="excel">Excel (.xlsx)</el-radio>
            <el-radio label="csv">CSV (.csv)</el-radio>
            <el-radio label="pdf">PDF (.pdf)</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="包含字段">
          <el-checkbox-group v-model="exportColumns">
            <el-checkbox v-for="col in allColumns" :key="col.prop" :label="col.prop">
              {{ col.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="时间范围" v-if="exportType === 'all'">
          <el-radio-group v-model="exportTimeRange">
            <el-radio label="current">当前页</el-radio>
            <el-radio label="all">全部数据</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmExport">导出</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseCard from '@/components/common/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import httpClient from '@/api/httpClient'
import { exportData, formatForExport } from '@/utils/export'

// ==================== 状态变量 ====================
const loading = ref(false)
const timeRange = ref('week')
const customRange = ref([])
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref([])              // 表格数据（真实）
const chartData = ref({ labels: [], dauData: [], revenueData: [] }) // 原始图表数据

// 关键指标（从表格数据计算，若表格为空则显示默认值）
const stats = computed(() => {
  if (tableData.value.length === 0) {
    return [
      { title: 'DAU', value: '0', change: 0 },
      { title: 'MAU', value: '0', change: 0 },
      { title: 'ARPU', value: '¥0', change: 0 },
      { title: '付费率', value: '0%', change: 0 }
    ]
  }
  const avgDau = Math.round(tableData.value.reduce((sum, d) => sum + d.dau, 0) / tableData.value.length)
  const avgMau = Math.round(tableData.value.reduce((sum, d) => sum + d.mau, 0) / tableData.value.length)
  const totalRevenue = tableData.value.reduce((sum, d) => sum + d.revenue, 0)
  const arpu = totalRevenue / (tableData.value.length * (avgDau || 1))  // 粗略ARPU
  const avgPayRate = tableData.value.reduce((sum, d) => sum + d.payRate, 0) / tableData.value.length
  return [
    { title: 'DAU', value: avgDau.toLocaleString(), change: 0 },
    { title: 'MAU', value: avgMau.toLocaleString(), change: 0 },
    { title: 'ARPU', value: `¥${arpu.toFixed(1)}`, change: 0 },
    { title: '付费率', value: `${avgPayRate.toFixed(1)}%`, change: 0 }
  ]
})

// 折线图数据：DAU 趋势
const dauData = computed(() => ({
  labels: chartData.value.labels,
  datasets: [{ name: 'DAU', data: chartData.value.dauData }]
}))

// 收入趋势图数据
const revenueData = computed(() => ({
  labels: chartData.value.labels,
  datasets: [{ name: '收入', data: chartData.value.revenueData }]
}))

// 留存率数据（暂时保留模拟，因为数据库无留存率）
const retentionData = ref({
  labels: ['次日', '3日', '7日', '14日', '30日'],
  datasets: [{ name: '留存率', data: [45, 32, 23, 18, 12] }]
})

// 所有可导出的列
const allColumns = [
  { label: '日期', prop: 'date' },
  { label: 'DAU', prop: 'dau' },
  { label: 'MAU', prop: 'mau' },
  { label: '新增用户', prop: 'newUsers' },
  { label: '收入(元)', prop: 'revenue' },
  { label: '平均时长(分钟)', prop: 'avgDuration' },
  { label: '付费率(%)', prop: 'payRate' }
]

// 导出相关
const exportDialogVisible = ref(false)
const exportFormat = ref('excel')
const exportType = ref('all')
const exportTimeRange = ref('current')
const exportColumns = ref(['date', 'dau', 'mau', 'newUsers', 'revenue', 'avgDuration', 'payRate'])

// ==================== 格式化函数 ====================
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const exportFormatters = {
  dau: (val) => formatNumber(val),
  mau: (val) => formatNumber(val),
  newUsers: (val) => formatNumber(val),
  revenue: (val) => `¥${formatNumber(val)}`,
  payRate: (val) => `${val}%`
}

// ==================== 获取表格数据（真实） ====================
const fetchTableData = async () => {
  loading.value = true
  try {
    const res = await httpClient.get('/analytics/table?days=30')
    const allData = res || []
    total.value = allData.length
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    tableData.value = allData.slice(start, end)
  } catch (err) {
    console.error('获取表格数据失败:', err)
    ElMessage.error('加载表格数据失败')
  } finally {
    loading.value = false
  }
}

// ==================== 获取图表数据（真实） ====================
const fetchChartData = async (days = 7) => {
  try {
    const res = await httpClient.get(`/metrics/trend?days=${days}`)
    chartData.value = res
  } catch (err) {
    console.error('获取趋势数据失败:', err)
  }
}

// ==================== 刷新所有数据 ====================
const refreshData = () => {
  fetchTableData()
  const days = timeRange.value === 'week' ? 7 : timeRange.value === 'month' ? 30 : 7
  fetchChartData(days)
  ElMessage.success('数据已刷新')
}

// ==================== 时间范围切换 ====================
const handleTimeRangeChange = (val) => {
  let days = 7
  if (val === 'today') days = 1
  if (val === 'week') days = 7
  if (val === 'month') days = 30
  if (val === 'quarter') days = 90
  fetchChartData(days)
}

const handleCustomRangeChange = (val) => {
  console.log('自定义范围:', val)
}

// ==================== 表格操作 ====================
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const deleteSelected = () => {
  if (selectedRows.value.length === 0) return
  ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条数据吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 仅为前端演示，实际应调用后端删除接口
    const ids = selectedRows.value.map(item => item.id)
    tableData.value = tableData.value.filter(item => !ids.includes(item.id))
    selectedRows.value = []
    ElMessage.success('删除成功（演示）')
    fetchTableData()
  }).catch(() => {})
}

const viewDetail = (row) => {
  ElMessage.info(`查看详情: ${row.date}`)
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchTableData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchTableData()
}

// ==================== 导出功能 ====================
const handleExport = (format) => {
  exportFormat.value = format
  exportType.value = 'all'
  exportDialogVisible.value = true
}

const exportSelected = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }
  exportType.value = 'selected'
  exportDialogVisible.value = true
}

const confirmExport = () => {
  let dataToExport = []
  if (exportType.value === 'selected') {
    dataToExport = selectedRows.value
  } else {
    dataToExport = tableData.value
  }
  const selectedColumns = allColumns.filter(col => exportColumns.value.includes(col.prop))
  const formattedData = formatForExport(dataToExport, exportFormatters)
  exportData(
    formattedData,
    `游戏数据报表_${timeRange.value}`,
    selectedColumns,
    exportFormat.value,
    '游戏运营数据报表'
  )
  exportDialogVisible.value = false
}

// ==================== 生命周期 ====================
onMounted(() => {
  fetchTableData()
  fetchChartData(7)
})

// 分页变化重新加载表格
watch([currentPage, pageSize], () => {
  fetchTableData()
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
  color: #fff;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #16213e;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.right {
  display: flex;
  gap: 12px;
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

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.selected-info {
  margin-left: 12px;
  color: #8a9bb2;
  font-size: 13px;
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表格样式覆盖 */
:deep(.el-table) {
  background: #16213e;
  color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #0f3460;
  color: #fff;
  font-weight: 500;
}

:deep(.el-table tr) {
  background: #16213e;
}

:deep(.el-table td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #1a2a4a;
}

:deep(.el-table__body tr:hover > td) {
  background: #1e3a5a !important;
}

:deep(.el-checkbox__inner) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 分页样式 */
:deep(.el-pagination) {
  color: #8a9bb2;
}

:deep(.el-pagination button) {
  background: #16213e;
  color: #8a9bb2;
}

:deep(.el-pager li) {
  background: #16213e;
  color: #8a9bb2;
}

:deep(.el-pager li.active) {
  background: #74b9ff;
  color: #fff;
}

/* 对话框样式 */
:deep(.el-dialog) {
  background: #16213e;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-dialog__title) {
  color: #fff;
}

:deep(.el-dialog__body) {
  color: #fff;
}

:deep(.el-form-item__label) {
  color: #8a9bb2;
}

:deep(.el-checkbox__label) {
  color: #fff;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    gap: 16px;
  }
  
  .left {
    width: 100%;
  }
  
  .right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>