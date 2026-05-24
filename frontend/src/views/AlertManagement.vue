<template>
  <div class="alert-management">
    <h1 class="page-title">🚨 告警管理</h1>

    <div class="action-bar">
      <div class="left">
        <el-dropdown @command="handleExport" style="margin-right: 8px">
          <el-button :icon="Download">
            导出告警 <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="excel">📊 导出 Excel</el-dropdown-item>
              <el-dropdown-item command="csv">📄 导出 CSV</el-dropdown-item>
              <el-dropdown-item command="pdf">📑 导出 PDF</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button :icon="Refresh" @click="fetchAlerts">刷新</el-button>
      </div>
      <div class="right">
        <el-radio-group v-model="filterLevel" size="small" @change="handleFilterChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="critical">紧急</el-radio-button>
          <el-radio-button value="warning">警告</el-radio-button>
          <el-radio-button value="info">信息</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <BaseCard title="告警历史">
      <el-table
        :data="alertHistory"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="create_time" label="时间" width="180" sortable />
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="alertLevelType(row.level)">{{ alertLevelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="告警类型" width="120" />
        <el-table-column prop="message" label="告警内容" show-overflow-tooltip />
        <el-table-column prop="value" label="当前值" width="100" />
        <el-table-column prop="threshold" label="阈值" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'resolved' ? 'success' : 'danger'">
              {{ row.status === 'resolved' ? '已解决' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="['admin', 'operator'].includes(userRole) && row.status !== 'resolved'"
              type="success" size="small"
              @click="handleAlert(row)"
            >处理</el-button>
            <el-button type="info" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="left" v-if="selectedRows.length">
          <el-button type="danger" size="small" @click="batchResolve">
            批量处理 ({{ selectedRows.length }})
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </BaseCard>

    <!-- 导出选项对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出选项" width="400px">
      <el-form label-width="80px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio value="excel">Excel</el-radio>
            <el-radio value="csv">CSV</el-radio>
            <el-radio value="pdf">PDF</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导出列">
          <el-checkbox-group v-model="exportColumns">
            <el-checkbox v-for="col in allColumns" :key="col.prop" :value="col.prop">{{ col.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseCard from '@/components/common/BaseCard.vue'
import httpClient from '@/api/httpClient'
import { exportData, formatForExport } from '@/utils/export'

const loading = ref(false)
const alertHistory = ref([])
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterLevel = ref('')

const userRole = computed(() => localStorage.getItem('userRole') || 'viewer')

const fetchAlerts = async () => {
  loading.value = true
  try {
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    }
    if (filterLevel.value) params.level = filterLevel.value

    const res = await httpClient.get('/alerts', { params })
    // 后端返回格式 { data: [], total: number }
    alertHistory.value = res.data || []
    total.value = res.total || 0
  } catch (err) {
    console.error('获取告警失败', err)
    ElMessage.error('获取告警失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchAlerts()
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchAlerts()
}

const handleCurrentChange = () => {
  fetchAlerts()
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const handleAlert = async (row) => {
  try {
    await ElMessageBox.confirm(`确定将告警 "${row.message}" 标记为已解决？`, '提示')
    await httpClient.put(`/alerts/${row.id}/resolve`)
    ElMessage.success('处理成功')
    fetchAlerts()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('处理失败')
  }
}

const batchResolve = async () => {
  if (!selectedRows.value.length) return
  try {
    await ElMessageBox.confirm(`确定批量处理 ${selectedRows.value.length} 条告警？`, '提示')
    const ids = selectedRows.value.map(row => row.id)
    await httpClient.put('/alerts/batch/resolve', { ids })
    ElMessage.success('批量处理成功')
    fetchAlerts()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('批量处理失败')
  }
}



const viewDetail = (row) => {
  ElMessage.info(`详情：${row.message}（当前值 ${row.value}，阈值 ${row.threshold}）`)
}

const alertLevelType = (level) => {
  const map = { critical: 'danger', warning: 'warning', info: 'info' }
  return map[level] || 'info'
}
const alertLevelText = (level) => {
  const map = { critical: '紧急', warning: '警告', info: '信息' }
  return map[level] || level
}

// ==================== 导出功能 ====================
const allColumns = [
  { label: '时间', prop: 'create_time' },
  { label: '级别', prop: 'level' },
  { label: '告警类型', prop: 'type' },
  { label: '告警内容', prop: 'message' },
  { label: '当前值', prop: 'value' },
  { label: '阈值', prop: 'threshold' },
  { label: '状态', prop: 'status' }
]

const exportDialogVisible = ref(false)
const exportFormat = ref('excel')
const exportColumns = ref(['create_time', 'level', 'type', 'message', 'status'])

const exportFormatters = {
  level: (v) => ({ critical: '紧急', warning: '警告', info: '信息' }[v] || v),
  status: (v) => (v === 'resolved' ? '已解决' : '未处理')
}

const handleExport = (format) => {
  exportFormat.value = format
  exportDialogVisible.value = true
}

const confirmExport = () => {
  const dataToExport = alertHistory.value
  if (!dataToExport.length) {
    ElMessage.warning('没有数据可导出')
    return
  }
  const selectedColumns = allColumns.filter(col => exportColumns.value.includes(col.prop))
  const formattedData = formatForExport(dataToExport, exportFormatters)
  exportData(
    formattedData,
    '告警数据报表',
    selectedColumns,
    exportFormat.value,
    '告警数据报表'
  )
  exportDialogVisible.value = false
}

onMounted(() => {
  fetchAlerts()
})
</script>

<style scoped>
.alert-management {
  padding: 24px;
  min-height: 100vh;
  background: #1a1a2e;
  color: #fff;
}

.page-title {
  font-size: 24px;
  margin: 0 0 24px 0;
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

/* 暗色表格样式 */
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

:deep(.el-table__empty-text) {
  color: #5a6a80;
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

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-footer .left {
  display: flex;
  align-items: center;
}

/* 按钮组暗色 */
:deep(.el-button-group .el-button) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #8a9bb2;
}

:deep(.el-button-group .el-button:hover) {
  color: #74b9ff;
  border-color: rgba(116, 185, 255, 0.3);
  background: rgba(116, 185, 255, 0.1);
}

/* 单选按钮组暗色 */
:deep(.el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #8a9bb2;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(116, 185, 255, 0.2);
  border-color: #74b9ff;
  color: #74b9ff;
  box-shadow: -1px 0 0 0 #74b9ff;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    gap: 12px;
  }
}
</style>