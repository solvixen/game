<template>
  <div class="analytics">
    <h1 class="page-title">📊 数据分析</h1>
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="left">
        <el-radio-group v-model="timeRange" size="large" @change="handleTimeRangeChange">
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseCard from '@/components/common/BaseCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { exportData, formatForExport } from '@/utils/export'
import * as mockData from '@/api/services/mockData'

// ==================== 状态变量 ====================
const loading = ref(false)
const timeRange = ref('week')
const customRange = ref([])
const tableRef = ref(null)
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 导出相关
const exportDialogVisible = ref(false)
const exportFormat = ref('excel')
const exportType = ref('all') // 'all' 或 'selected'
const exportTimeRange = ref('current')
const exportColumns = ref(['date', 'dau', 'mau', 'newUsers', 'revenue', 'avgDuration', 'payRate'])

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

// ==================== 模拟数据 ====================
const stats = ref([
  { title: 'DAU', value: '12,345', change: 8.5 },
  { title: 'MAU', value: '45,678', change: 12.3 },
  { title: 'ARPU', value: '¥25.6', change: 5.2 },
  { title: '付费率', value: '15.8%', change: -2.1 }
])

// 图表数据
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

// 表格数据
const tableData = ref([
  { 
    id: 1,
    date: '2026-03-18', 
    dau: 12345, 
    mau: 45678, 
    newUsers: 1234, 
    revenue: 34567, 
    avgDuration: 45,
    payRate: 12.5
  },
  { 
    id: 2,
    date: '2026-03-17', 
    dau: 13456, 
    mau: 46789, 
    newUsers: 1345, 
    revenue: 37890, 
    avgDuration: 47,
    payRate: 13.2
  },
  { 
    id: 3,
    date: '2026-03-16', 
    dau: 14567, 
    mau: 47890, 
    newUsers: 1456, 
    revenue: 41234, 
    avgDuration: 48,
    payRate: 14.1
  },
  { 
    id: 4,
    date: '2026-03-15', 
    dau: 15678, 
    mau: 48901, 
    newUsers: 1567, 
    revenue: 44567, 
    avgDuration: 52,
    payRate: 15.3
  },
  { 
    id: 5,
    date: '2026-03-14', 
    dau: 16789, 
    mau: 49912, 
    newUsers: 1678, 
    revenue: 47890, 
    avgDuration: 55,
    payRate: 16.8
  }
])

// ==================== 格式化函数 ====================
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 导出格式化器
const exportFormatters = {
  dau: (val) => formatNumber(val),
  mau: (val) => formatNumber(val),
  newUsers: (val) => formatNumber(val),
  revenue: (val) => `¥${formatNumber(val)}`,
  payRate: (val) => `${val}%`
}

// ==================== 导出功能 ====================

/**
 * 处理导出按钮点击
 */
const handleExport = (format) => {
  exportFormat.value = format
  exportType.value = 'all'
  exportDialogVisible.value = true
}

/**
 * 导出选中数据
 */
const exportSelected = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }
  
  exportType.value = 'selected'
  exportDialogVisible.value = true
}

/**
 * 确认导出
 */
const confirmExport = () => {
  // 确定要导出的数据
  let dataToExport = []
  
  if (exportType.value === 'selected') {
    dataToExport = selectedRows.value
  } else {
    if (exportTimeRange.value === 'current') {
      dataToExport = tableData.value
    } else {
      // 全部数据（模拟）
      dataToExport = tableData.value
      ElMessage.info('实际项目中会导出全部数据')
    }
  }
  
  // 筛选要导出的列
  const selectedColumns = allColumns.filter(col => 
    exportColumns.value.includes(col.prop)
  )
  
  // 格式化数据
  const formattedData = formatForExport(dataToExport, exportFormatters)
  
  // 导出
  exportData(
    formattedData,
    `游戏数据报表_${timeRange.value}`,
    selectedColumns,
    exportFormat.value,
    '游戏运营数据报表'
  )
  
  exportDialogVisible.value = false
}

// ==================== 表格操作 ====================
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const deleteSelected = () => {
  if (selectedRows.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定删除选中的 ${selectedRows.value.length} 条数据吗？`, 
    '警告', 
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 删除逻辑
    const ids = selectedRows.value.map(item => item.id)
    tableData.value = tableData.value.filter(item => !ids.includes(item.id))
    selectedRows.value = []
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const viewDetail = (row) => {
  ElMessage.info(`查看详情: ${row.date}`)
}

// ==================== 其他方法 ====================
const handleTimeRangeChange = (val) => {
  console.log('时间范围变化:', val)
  // 重新加载数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const handleCustomRangeChange = (val) => {
  console.log('自定义范围:', val)
}

const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 500)
}

const handleSizeChange = (val) => {
  console.log('每页条数变化:', val)
}

const handleCurrentChange = (val) => {
  console.log('当前页变化:', val)
}

onMounted(() => {
  // 初始化数据
  console.log('Analytics页面已加载')
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