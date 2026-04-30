<template>
  <div class="alert-management">
    <h1 class="page-title">🚨 告警管理</h1>

    <div class="action-bar">
      <div class="left">
        <el-button-group>
          <el-button :icon="Download" @click="showExportDialog = true">导出告警</el-button>
          <el-button :icon="Refresh" @click="fetchAlerts">刷新</el-button>
        </el-button-group>
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

    <!-- 导出对话框略，与之前相同 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseCard from '@/components/common/BaseCard.vue'
import httpClient from '@/api/httpClient'

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

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchAlerts()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
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
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>