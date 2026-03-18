<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">游戏数据实时监控系统</h2>
      
      <el-form 
        ref="formRef"
        :model="form" 
        :rules="rules"
        label-width="0"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="demo-account">
        <p class="demo-title">测试账号：</p>
        <p><el-tag size="small" type="success">管理员</el-tag> admin / 123456</p>
        <p><el-tag size="small" type="primary">运营人员</el-tag> operator / 123456</p>
        <p><el-tag size="small" type="warning">开发人员</el-tag> developer / 123456</p>
        <p><el-tag size="small" type="info">观察员</el-tag> viewer / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 测试用户列表
const users = [
  { username: 'admin', password: '123456', role: 'admin', name: '管理员' },
  { username: 'operator', password: '123456', role: 'operator', name: '运营人员' },
  { username: 'developer', password: '123456', role: 'developer', name: '开发人员' },
  { username: 'viewer', password: '123456', role: 'viewer', name: '观察员' }
]

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      // 查找用户
      const user = users.find(u => 
        u.username === form.value.username && 
        u.password === form.value.password
      )
      
      setTimeout(() => {
        if (user) {
          // 存储用户信息
          localStorage.setItem('token', 'mock-token-' + Date.now())
          localStorage.setItem('userRole', user.role)
          localStorage.setItem('userName', user.name)
          localStorage.setItem('username', user.username)
          
          ElMessage.success(`欢迎 ${user.name}`)
          router.push('/')
        } else {
          ElMessage.error('用户名或密码错误')
        }
        loading.value = false
      }, 1000)
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.login-title {
  text-align: center;
  color: #fff;
  font-size: 24px;
  margin-bottom: 30px;
  font-weight: 600;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-input__prefix) {
  color: #8a9bb2;
}

.el-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.demo-account {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #8a9bb2;
  font-size: 14px;
}

.demo-title {
  margin-bottom: 10px;
  font-weight: 600;
  color: #fff;
}

.demo-account p {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-tag) {
  min-width: 60px;
  text-align: center;
}
</style>