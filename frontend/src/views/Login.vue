<template>
  <div class="login-container">
    <!-- 粒子背景 -->
    <canvas ref="particleCanvas" class="particle-bg"></canvas>

    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 4L6 14v20l18 10 18-10V14L24 4z"
              stroke="#74b9ff"
              stroke-width="2"
              fill="rgba(116,185,255,0.1)"
            />
            <circle
              cx="24"
              cy="22"
              r="8"
              stroke="#a29bfe"
              stroke-width="2"
              fill="rgba(162,155,254,0.15)"
            />
            <path
              d="M20 32l-4 8M28 32l4 8M24 30v10"
              stroke="#74b9ff"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <h2 class="login-title">游戏数据实时监控系统</h2>
        <p class="login-subtitle">Game Data Real-time Monitoring</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="0"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" prefix-icon="User" />
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
            class="login-btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="demo-account">
        <p class="demo-title">测试账号</p>
        <p><el-tag size="small" type="success">管理员</el-tag> admin / 123456</p>
        <p><el-tag size="small" type="primary">运营人员</el-tag> operator / 123456</p>
        <p><el-tag size="small" type="warning">开发人员</el-tag> developer / 123456</p>
        <p><el-tag size="small" type="info">观察员</el-tag> viewer / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import httpClient from '@/api/httpClient'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const particleCanvas = ref(null)

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true

      try {
        // 调用后端 JWT 登录接口
        const res = await httpClient.post('/auth/login', {
          username: form.value.username,
          password: form.value.password
        })

        // 存储 JWT 令牌和用户信息
        localStorage.setItem('token', res.token)
        localStorage.setItem('userRole', res.user.role)
        localStorage.setItem('userName', res.user.username)
        localStorage.setItem('username', res.user.username)

        // 角色中文映射
        const roleMap = {
          admin: '管理员',
          operator: '运营人员',
          developer: '开发人员',
          viewer: '观察员'
        }
        ElMessage.success(`欢迎 ${roleMap[res.user.role] || res.user.username}`)
        router.push('/')
      } catch (err) {
        const msg = err.response?.data?.error || err.message || '登录失败'
        ElMessage.error(msg)
      } finally {
        loading.value = false
      }
    }
  })
}

// ==================== 粒子背景 ====================
let animationId = null

const initParticles = () => {
  const canvas = particleCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const particles = []
  const particleCount = 60
  const connectDistance = 150

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2
    })
  }

  let mouseX = -1000,
    mouseY = -1000
  const onMouseMove = (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  }
  window.addEventListener('mousemove', onMouseMove)

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < connectDistance) {
          const opacity = (1 - dist / connectDistance) * 0.15
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(116, 185, 255, ${opacity})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      }
    }

    // 绘制粒子
    particles.forEach((p) => {
      // 鼠标吸引效果
      const dx = mouseX - p.x
      const dy = mouseY - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 200) {
        p.vx += dx * 0.00005
        p.vy += dy * 0.00005
      }

      p.x += p.vx
      p.y += p.vy

      // 边界反弹
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(116, 185, 255, ${p.opacity})`
      ctx.fill()
    })

    animationId = requestAnimationFrame(draw)
  }

  draw()

  // 返回清理函数
  return () => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', onMouseMove)
  }
}

onMounted(() => {
  initParticles()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8edf2 100%);
  position: relative;
  overflow: hidden;
}

.particle-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.login-card {
  width: 420px;
  padding: 40px;
  background: rgba(240, 244, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 80px rgba(116, 185, 255, 0.05);
  border: 1px solid rgba(116, 185, 255, 0.15);
  z-index: 1;
  animation: cardFadeIn 0.8s ease-out;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  animation: logoFloat 3s ease-in-out infinite;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.login-title {
  color: #111827;
  font-size: 22px;
  margin: 0 0 8px;
  font-weight: 700;
  background: linear-gradient(135deg, #74b9ff, #a29bfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-subtitle {
  color: #5a6a80;
  font-size: 12px;
  margin: 0;
  letter-spacing: 1px;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #e5e7eb;
  box-shadow: none;
  border-radius: 10px;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(116, 185, 255, 0.3);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(116, 185, 255, 0.6);
  box-shadow: 0 0 12px rgba(116, 185, 255, 0.1);
}

:deep(.el-input__inner) {
  color: #111827;
}

:deep(.el-input__prefix) {
  color: #5a6a80;
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border-radius: 10px;
  background: linear-gradient(135deg, #74b9ff, #a29bfe);
  border: none;
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(116, 185, 255, 0.3);
}

.login-btn:active {
  transform: translateY(0);
}

.demo-account {
  margin-top: 28px;
  padding-top: 20px;
  border: 1px solid #e5e7eb;
  color: #5a6a80;
  font-size: 13px;
}

.demo-title {
  margin-bottom: 10px;
  font-weight: 600;
  color: #6b7280;
  font-size: 13px;
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
