<template>
  <div class="alert-management">
    <h1 class="page-title">🚨 告警管理</h1>

    <div class="action-bar">
      <div class="left">
        <el-dropdown style="margin-right: 8px" @command="handleExport">
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
      <!-- 虚拟滚动表格区域 -->
      <div class="virtual-table-wrapper">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2
              v-loading="loading"
              :columns="tableColumns"
              :data="alertHistory"
              :width="width"
              :height="height"
              fixed
              :row-height="48"
              :header-height="48"
              :sort-by="sortState"
              @column-sort="handleSort"
            />
          </template>
        </el-auto-resizer>
      </div>

      <div class="table-footer">
        <div v-if="selectedIds.size" class="left">
          <el-button type="primary" size="small" @click="batchResolve">
            批量处理 ({{ selectedIds.size }})
          </el-button>
          <el-button v-if="userRole === 'admin'" type="danger" size="small" @click="batchDelete">
            批量删除 ({{ selectedIds.size }})
          </el-button>
        </div>
        <span class="total-info">
          共 {{ total }} 条告警，当前已加载 {{ alertHistory.length }} 条（虚拟滚动优化）
        </span>
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
            <el-checkbox v-for="col in allColumns" :key="col.prop" :value="col.prop">{{
              col.label
            }}</el-checkbox>
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
import { ref, computed, onMounted, h } from 'vue'
import { ElMessage, ElMessageBox, ElTag, ElButton, ElCheckbox } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseCard from '@/components/common/BaseCard.vue'
import httpClient from '@/api/httpClient'
import { exportData, formatForExport } from '@/utils/export'

const loading = ref(false)
const alertHistory = ref([])
const total = ref(0)
const filterLevel = ref('')
const selectedIds = ref(new Set())
const sortState = ref({ key: 'create_time', order: 'desc' })

const userRole = computed(() => localStorage.getItem('userRole') || 'viewer')

// ==================== 虚拟滚动表格列定义 ====================
const tableColumns = computed(() => {
  const isAdmin = userRole.value === 'admin'
  const canOperate = ['admin', 'operator'].includes(userRole.value)

  return [
    {
      key: 'selection',
      title: '',
      dataKey: 'selection',
      width: 50,
      align: 'center',
      fixed: true,
      cellRenderer: ({ rowData }) =>
        h(ElCheckbox, {
          modelValue: selectedIds.value.has(rowData.id),
          'onUpdate:modelValue': (val) => {
            const next = new Set(selectedIds.value)
            val ? next.add(rowData.id) : next.delete(rowData.id)
            selectedIds.value = next
          }
        })
    },
    {
      key: 'create_time',
      title: '时间',
      dataKey: 'create_time',
      width: 180,
      sortable: true
    },
    {
      key: 'level',
      title: '级别',
      dataKey: 'level',
      width: 100,
      align: 'center',
      cellRenderer: ({ cellData: level }) =>
        h(ElTag, { type: alertLevelType(level), size: 'small' }, () => alertLevelText(level))
    },
    {
      key: 'type',
      title: '告警类型',
      dataKey: 'type',
      width: 120
    },
    {
      key: 'message',
      title: '告警内容',
      dataKey: 'message',
      width: 280
    },
    {
      key: 'value',
      title: '当前值',
      dataKey: 'value',
      width: 90,
      align: 'center'
    },
    {
      key: 'threshold',
      title: '阈值',
      dataKey: 'threshold',
      width: 90,
      align: 'center'
    },
    {
      key: 'status',
      title: '状态',
      dataKey: 'status',
      width: 90,
      align: 'center',
      cellRenderer: ({ cellData: status }) =>
        h(
          ElTag,
          {
            type: status === 'resolved' ? 'success' : 'danger',
            size: 'small'
          },
          () => (status === 'resolved' ? '已解决' : '未处理')
        )
    },
    {
      key: 'actions',
      title: '操作',
      dataKey: 'actions',
      width: 180,
      align: 'center',
      fixed: true,
      cellRenderer: ({ rowData }) => {
        const children = []
        if (canOperate && rowData.status !== 'resolved') {
          children.push(
            h(
              ElButton,
              {
                type: 'success',
                size: 'small',
                onClick: () => handleAlert(rowData)
              },
              () => '处理'
            )
          )
        }
        children.push(
          h(
            ElButton,
            {
              type: 'info',
              size: 'small',
              onClick: () => viewDetail(rowData)
            },
            () => '详情'
          )
        )
        if (isAdmin) {
          children.push(
            h(
              ElButton,
              {
                type: 'danger',
                size: 'small',
                onClick: () => handleDelete(rowData)
              },
              () => '删除'
            )
          )
        }
        return h(
          'div',
          { style: 'display:flex;gap:4px;justify-content:center;flex-wrap:wrap' },
          children
        )
      }
    }
  ]
})

// ==================== 数据加载（全量加载 + 虚拟滚动渲染） ====================
const fetchAlerts = async () => {
  loading.value = true
  try {
    // 虚拟滚动模式：全量加载，由 el-table-v2 负责只渲染可视区域
    const params = { limit: 5000, offset: 0 }
    if (filterLevel.value) params.level = filterLevel.value

    const res = await httpClient.get('/alerts', { params })
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
  fetchAlerts()
}

const handleSort = ({ key, order }) => {
  sortState.value = { key, order }
  // 前端排序（虚拟滚动场景）
  if (!order) return
  const arr = [...alertHistory.value]
  arr.sort((a, b) => {
    const va = a[key] ?? '',
      vb = b[key] ?? ''
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
    return order === 'desc' ? -cmp : cmp
  })
  alertHistory.value = arr
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
  if (!selectedIds.value.size) return
  try {
    const ids = Array.from(selectedIds.value)
    await ElMessageBox.confirm(`确定批量处理 ${ids.length} 条告警？`, '提示')
    await httpClient.put('/alerts/batch/resolve', { ids })
    ElMessage.success('批量处理成功')
    selectedIds.value = new Set()
    fetchAlerts()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('批量处理失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除告警 "${row.message}"？此操作不可恢复`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await httpClient.delete(`/alerts/${row.id}`)
    ElMessage.success('删除成功')
    fetchAlerts()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

const batchDelete = async () => {
  if (!selectedIds.value.size) return
  try {
    const ids = Array.from(selectedIds.value)
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条告警？此操作不可恢复`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await httpClient.delete('/alerts/batch', { data: { ids } })
    ElMessage.success(`成功删除 ${ids.length} 条告警`)
    selectedIds.value = new Set()
    fetchAlerts()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('批量删除失败')
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
  level: (v) => ({ critical: '紧急', warning: '警告', info: '信息' })[v] || v,
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
  const selectedColumns = allColumns.filter((col) => exportColumns.value.includes(col.prop))
  const formattedData = formatForExport(dataToExport, exportFormatters)
  exportData(formattedData, '告警数据报表', selectedColumns, exportFormat.value, '告警数据报表')
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
  background: #f5f5f5;
  color: #111827;
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
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* 虚拟滚动表格容器 */
.virtual-table-wrapper {
  height: 520px;
  border-radius: 8px;
  overflow: hidden;
}

/* el-table-v2 浅色样式 */
:deep(.el-table-v2__header-row) {
  background: #e8edf2;
}
:deep(.el-table-v2__row) {
  background: #ffffff;
}
:deep(.el-table-v2__row:hover) {
  background: #dbeafe;
}
:deep(.el-table-v2__cell) {
  color: #111827;
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.table-footer .left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-info {
  color: #6b7280;
  font-size: 13px;
}

/* 单选按钮组 */
:deep(.el-radio-button__inner) {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #1a56db;
  border-color: #1a56db;
  color: #ffffff;
  box-shadow: -1px 0 0 0 #1a56db;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    gap: 12px;
  }
  .virtual-table-wrapper {
    height: 400px;
  }
}
</style>
