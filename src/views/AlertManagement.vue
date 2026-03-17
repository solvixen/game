<template>
  <div class="alert-management">
    <h1 class="page-title">告警管理</h1>
    
    <!-- 告警统计 -->
    <div class="alert-stats">
      <BaseCard v-for="stat in alertStats" :key="stat.title" class="stat-card">
        <div class="stat-title">{{ stat.title }}</div>
        <div class="stat-number" :class="stat.type">{{ stat.count }}</div>
      </BaseCard>
    </div>

    <!-- 告警规则配置 -->
    <BaseCard title="告警规则配置" class="rules-card">
      <el-form :model="alertRules" label-width="120px">
        <el-form-item label="CPU阈值">
          <el-slider 
            v-model="alertRules.cpuThreshold" 
            :min="0" 
            :max="100"
            :format-tooltip="val => val + '%'"
          />
        </el-form-item>
        
        <el-form-item label="内存阈值">
          <el-slider 
            v-model="alertRules.memoryThreshold" 
            :min="0" 
            :max="100"
            :format-tooltip="val => val + '%'"
          />
        </el-form-item>
        
        <el-form-item label="延迟阈值">
          <el-input-number 
            v-model="alertRules.latencyThreshold" 
            :min="0" 
            :max="1000"
            :step="10"
          /> ms
        </el-form-item>
        
        <el-form-item label="告警方式">
          <el-checkbox-group v-model="alertRules.notificationMethods">
            <el-checkbox label="email">邮件</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
            <el-checkbox label="webhook">Webhook</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="saveRules">保存配置</el-button>
        </el-form-item>
      </el-form>
    </BaseCard>

    <!-- 告警历史 -->
    <BaseCard title="告警历史">
      <el-table :data="alertHistory" style="width: 100%" stripe>
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="alertLevelType(row.level)">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="告警类型" width="120" />
        <el-table-column prop="message" label="告警内容" />
        <el-table-column prop="value" label="当前值" width="100" />
        <el-table-column prop="threshold" label="阈值" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'resolved' ? 'success' : 'danger'">
              {{ row.status === 'resolved' ? '已解决' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="table-footer">
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'

// 告警统计
const alertStats = ref([
  { title: '紧急告警', count: 3, type: 'critical' },
  { title: '警告告警', count: 7, type: 'warning' },
  { title: '信息告警', count: 12, type: 'info' },
  { title: '已解决', count: 45, type: 'resolved' }
])

// 告警规则
const alertRules = ref({
  cpuThreshold: 80,
  memoryThreshold: 85,
  latencyThreshold: 200,
  notificationMethods: ['email', 'webhook']
})

// 告警历史
const alertHistory = ref([
  {
    time: '2026-03-17 14:23:45',
    level: 'critical',
    type: 'CPU过载',
    message: '服务器-3 CPU使用率超过90%',
    value: '92%',
    threshold: '80%',
    status: 'pending'
  },
  {
    time: '2026-03-17 13:15:22',
    level: 'warning',
    type: '内存不足',
    message: '服务器-5 内存使用率85%',
    value: '85%',
    threshold: '80%',
    status: 'pending'
  },
  {
    time: '2026-03-17 11:08:33',
    level: 'critical',
    type: '服务离线',
    message: '服务器-2 离线超过5分钟',
    value: '离线',
    threshold: '-',
    status: 'resolved'
  },
  {
    time: '2026-03-17 09:45:12',
    level: 'info',
    type: '玩家激增',
    message: '在线玩家数突破5000',
    value: '5234',
    threshold: '5000',
    status: 'resolved'
  }
])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

const alertLevelType = (level) => {
  const map = {
    critical: 'danger',
    warning: 'warning',
    info: 'info',
    resolved: 'success'
  }
  return map[level] || 'info'
}

const saveRules = () => {
  console.log('保存告警规则:', alertRules.value)
  ElMessage.success('配置保存成功')
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

.alert-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-title {
  color: #8a9bb2;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
}

.stat-number.critical {
  color: #e17055;
}

.stat-number.warning {
  color: #fdcb6e;
}

.stat-number.info {
  color: #74b9ff;
}

.stat-number.resolved {
  color: #00b894;
}

.rules-card {
  margin-bottom: 24px;
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>