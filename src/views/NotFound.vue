<template>
  <div class="not-found">
    <div class="content">
      <h1 class="error-code">404</h1>
      <h2 class="error-message">页面不存在</h2>
      <p class="error-description">您访问的页面可能已被移除或暂时不可用</p>
      <el-button type="primary" size="large" @click="goHome">
        返回首页
      </el-button>
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
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

.content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #74b9ff;
  margin: 0;
  line-height: 1;
  text-shadow: 0 0 20px rgba(116, 185, 255, 0.5);
}

.error-message {
  font-size: 32px;
  margin: 20px 0 10px;
}

.error-description {
  color: #8a9bb2;
  margin-bottom: 30px;
}
</style>