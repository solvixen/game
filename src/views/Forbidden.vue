<template>
  <div class="forbidden">
    <div class="content">
      <h1 class="error-code">403</h1>
      <h2 class="error-message">无权访问</h2>
      <p class="error-description">您没有权限访问此页面，请联系管理员</p>
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="goBack">
          返回上一页
        </el-button>
        <el-button size="large" @click="goHome">
          返回首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.forbidden {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

.content {
  text-align: center;
  padding: 40px;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #e17055;
  margin: 0;
  line-height: 1;
  text-shadow: 0 0 20px rgba(225, 112, 85, 0.5);
}

.error-message {
  font-size: 32px;
  margin: 20px 0 10px;
}

.error-description {
  color: #8a9bb2;
  margin-bottom: 30px;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>