<template>
  <div class="user-management">
    <h1 class="page-title">👤 用户管理</h1>

    <div class="action-bar">
      <div class="left">
        <span style="color: #6b7280; font-size: 14px"> 共 {{ users.length }} 位用户 </span>
      </div>
      <div class="right">
        <el-button v-if="isAdmin" type="primary" @click="showAddDialog = true">
          新增用户
        </el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="users" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="roleTagType(row.role)" effect="dark">{{ roleLabel(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_login" label="最后登录" width="180">
        <template #default="{ row }">
          {{ formatTime(row.last_login) }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column v-if="isAdmin" label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button
            size="small"
            type="danger"
            :disabled="row.id === currentUserId"
            @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="showAddDialog" title="新增用户" width="400px" class="dark-dialog">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="addForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="addForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="addForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="开发者" value="developer" />
            <el-option label="观察者" value="viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑用户" width="400px" class="dark-dialog">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="editForm.password"
            type="password"
            placeholder="不修改请留空"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="开发者" value="developer" />
            <el-option label="观察者" value="viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import httpClient from '@/api/httpClient'

const users = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const showEditDialog = ref(false)

const addForm = ref({ username: '', password: '', role: 'viewer' })
const editForm = ref({ id: null, username: '', password: '', role: '' })

const currentUserId = ref(null)
const isAdmin = computed(() => localStorage.getItem('userRole') === 'admin')

onMounted(() => {
  currentUserId.value = parseInt(localStorage.getItem('userId')) || null
  fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  try {
    const res = await httpClient.get('/users')
    users.value = res.data || res
  } catch (err) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

function roleTagType(role) {
  const map = { admin: 'danger', operator: 'warning', developer: '', viewer: 'info' }
  return map[role] || 'info'
}

function roleLabel(role) {
  const map = { admin: '管理员', operator: '操作员', developer: '开发者', viewer: '观察者' }
  return map[role] || role
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function handleAdd() {
  if (!addForm.value.username || !addForm.value.password) {
    ElMessage.warning('用户名和密码不能为空')
    return
  }
  try {
    await httpClient.post('/users', addForm.value)
    ElMessage.success('用户创建成功')
    showAddDialog.value = false
    addForm.value = { username: '', password: '', role: 'viewer' }
    fetchUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '创建用户失败')
  }
}

function openEditDialog(row) {
  editForm.value = {
    id: row.id,
    username: row.username,
    password: '',
    role: row.role
  }
  showEditDialog.value = true
}

async function handleEdit() {
  const updates = {}
  if (editForm.value.password) {
    updates.password = editForm.value.password
  }
  updates.role = editForm.value.role
  try {
    await httpClient.put(`/users/${editForm.value.id}`, updates)
    ElMessage.success('用户更新成功')
    showEditDialog.value = false
    fetchUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '更新用户失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${row.username}」吗？此操作不可恢复。`,
      '确认删除',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    await httpClient.delete(`/users/${row.id}`)
    ElMessage.success('用户删除成功')
    fetchUsers()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.error || '删除用户失败')
    }
  }
}
</script>

<style scoped>
.user-management {
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

/* 暗色表格样式 */
:deep(.el-table) {
  background: #ffffff;
  color: #111827;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #e8edf2;
  color: #111827;
  font-weight: 500;
}

:deep(.el-table tr) {
  background: #ffffff;
}

:deep(.el-table td) {
  border: 1px solid #e5e7eb;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #eff6ff;
}

:deep(.el-table__body tr:hover > td) {
  background: #dbeafe !important;
}

:deep(.el-table__empty-text) {
  color: #5a6a80;
}

:deep(.el-tag) {
  border: none;
}

/* 暗色对话框 */
:deep(.dark-dialog .el-dialog) {
  background: #ffffff;
  border: 1px solid #d1d5db;
}

:deep(.dark-dialog .el-dialog__title) {
  color: #111827;
}

:deep(.dark-dialog .el-dialog__body) {
  color: #6b7280;
}

:deep(.dark-dialog .el-form-item__label) {
  color: #6b7280;
}

:deep(.dark-dialog .el-input__wrapper) {
  background: #f5f5f5;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

:deep(.dark-dialog .el-input__inner) {
  color: #111827;
}

:deep(.dark-dialog .el-select .el-input__wrapper) {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
