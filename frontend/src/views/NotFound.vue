<template>
  <div class="not-found">
    <div class="content">
      <h1 class="error-code">404</h1>
      <h2 class="error-message">页面不存在</h2>
      <p class="error-description">您访问的页面可能已被移除或暂时不可用</p>
      <el-button type="primary" size="large" @click="goHome"> 返回首页 </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8edf2 100%);
  color: #111827;
}

.content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #1a56db;
  margin: 0;
  line-height: 1;
  text-shadow: 0 0 20px rgba(116, 185, 255, 0.5);
}

.error-message {
  font-size: 32px;
  margin: 20px 0 10px;
}

.error-description {
  color: #6b7280;
  margin-bottom: 30px;
}
</style>
