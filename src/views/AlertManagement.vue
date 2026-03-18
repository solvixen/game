<template>
  <div class="alert-management">
    <h1 class="page-title">🚨 告警管理</h1>
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="left">
        <el-button-group>
          <el-button :icon="Download" @click="showExportDialog = true">
            导出告警
          </el-button>
          <el-button :icon="Refresh" @click="refreshAlerts">
            刷新
          </el-button>
        </el-button-group>
      </div>
      
      <div class="right">
        <el-radio-group v-model="filterLevel" size="small">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="critical">紧急</el-radio-button>
          <el-radio-button label="warning">警告</el-radio-button>
          <el-radio-button label="info">信息</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 告警表格 -->
    <BaseCard title="告警历史">
      <el-table 
        :data="filteredAlerts" 
        style="width: 100%" 
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="time" label="时间" width="180" sortable />
        <el-table-column label="级别" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="alertLevelType(row.level)" size="large">
              {{ alertLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="告警类型" width="120" sortable />
        <el-table-column prop="message" label="告警内容" show-overflow-tooltip />
        <el-table-column prop="value" label="当前值" width="100" />
        <el-table-column prop="threshold" label="阈值" width="100" />
        <el-table-column label="状态" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="row.status === 'resolved' ? 'success' : 'danger'" size="small">
              {{ row.status === 'resolved' ? '已解决' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="table-footer">
        <div class="left">
          <span class="selected-info" v-if="selectedRows.length">
            已选择 {{ selectedRows.length }} 项
          </span>
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </BaseCard>

    <!-- 导出对话框 -->
    <el-dialog v-model="showExportDialog" title="导出告警" width="450px">
      <el-form label-width="100px">
        <el-form-item label="时间范围">
          <el-radio-group v-model="exportTimeRange">
            <el-radio label="all">全部</el-radio>
            <el-radio label="today">今日</el-radio>
            <el-radio label="week">本周</el-radio>
            <el-radio label="month">本月</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="告警级别">
          <el-checkbox-group v-model="exportLevels">
            <el-checkbox label="critical">紧急</el-checkbox>
            <el-checkbox label="warning">警告</el-checkbox>
            <el-checkbox label="info">信息</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportScope">
            <el-radio label="all">全部数据</el-radio>
            <el-radio label="selected" :disabled="!selectedRows.length">选中数据 ({{ selectedRows.length }})</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio label="excel">Excel (.xlsx)</el-radio>
            <el-radio label="csv">CSV (.csv)</el-radio>
            <el-radio label="pdf">PDF (.pdf)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showExportDialog = false">取消</el-button>
          <el-button type="primary" @click="exportAlerts">确认导出</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseCard from '@/components/common/BaseCard.vue'
import { exportData, formatForExport } from '@/utils/export'

// ==================== 数据 ====================
const showExportDialog = ref(false)
const filterLevel = ref('')
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 导出选项
const exportTimeRange = ref('all')
const exportLevels = ref(['critical', 'warning', 'info'])
const exportScope = ref('all')
const exportFormat = ref('excel')

// 告警历史数据
const alertHistory = ref([
  {
    id: 1,
    time: '2026-03-18 14:23:45',
    level: 'critical',
    type: 'CPU过载',
    message: '服务器-3 CPU使用率92%',
    value: '92%',
    threshold: '80%',
    status: 'pending',
    server: '服务器-3'
  },
  {
    id: 2,
    time: '2026-03-18 13:15:22',
    level: 'warning',
    type: '内存不足',
    message: '服务器-5 内存使用率88%',
    value: '88%',
    threshold: '85%',
    status: 'pending',
    server: '服务器-5'
  },
  {
    id: 3,
    time: '2026-03-18 11:08:33',
    level: 'critical',
    type: '服务离线',
    message: '服务器-2 离线超过5分钟',
    value: '离线',
    threshold: '-',
    status: 'resolved',
    server: '服务器-2'
  },
  {
    id: 4,
    time: '2026-03-18 09:45:12',
    level: 'info',
    type: '玩家激增',
    message: '在线玩家数突破5000',
    value: '5234',
    threshold: '5000',
    status: 'resolved',
    server: '全局'
  }
])

// ==================== 计算属性 ====================
const filteredAlerts = computed(() => {
  if (!filterLevel.value) return alertHistory.value
  return alertHistory.value.filter(item => item.level === filterLevel.value)
})

// ==================== 列配置 ====================
const exportColumns = [
  { label: '时间', prop: 'time' },
  { label: '级别', prop: 'level' },
  { label: '告警类型', prop: 'type' },
  { label: '告警内容', prop: 'message' },
  { label: '当前值', prop: 'value' },
  { label: '阈值', prop: 'threshold' },
  { label: '状态', prop: 'status' },
  { label: '服务器', prop: 'server' }
]

// 格式化函数
const exportFormatters = {
  level: (val) => {
    const map = { critical: '紧急', warning: '警告', info: '信息' }
    return map[val] || val
  },
  status: (val) => val === 'resolved' ? '已解决' : '未处理'
}

// ==================== 方法 ====================
const alertLevelType = (level) => {
  const map = { critical: 'danger', warning: 'warning', info: 'info' }
  return map[level] || 'info'
}

const alertLevelText = (level) => {
  const map = { critical: '紧急', warning: '警告', info: '信息' }
  return map[level] || level
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const refreshAlerts = () => {
  ElMessage.success('已刷新')
}

const exportAlerts = () => {
  // 确定要导出的数据
  let dataToExport = []
  
  if (exportScope.value === 'selected' && selectedRows.value.length > 0) {
    dataToExport = selectedRows.value
  } else {
    dataToExport = [...alertHistory.value]
  }
  
  // 按级别筛选
  dataToExport = dataToExport.filter(item => exportLevels.value.includes(item.level))
  
  // 按时间筛选（示例逻辑，实际项目中需要根据时间过滤）
  if (exportTimeRange.value !== 'all') {
    // 这里添加实际的时间过滤逻辑
    console.log('按时间筛选:', exportTimeRange.value)
  }
  
  // 格式化数据
  const formattedData = formatForExport(dataToExport, exportFormatters)
  
  // 导出
  exportData(
    formattedData,
    `告警记录_${new Date().toLocaleDateString()}`,
    exportColumns,
    exportFormat.value,
    '告警历史报表'
  )
  
  showExportDialog.value = false
  ElMessage.success('导出任务已开始')
}

const handleSizeChange = (val) => {
  console.log('每页条数变化:', val)
}

const handleCurrentChange = (val) => {
  console.log('当前页变化:', val)
}
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

.selected-info {
  color: #8a9bb2;
  font-size: 13px;
}
</style>