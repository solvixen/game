<template>
  <div class="loading-spinner" :style="{ width: size, height: size }">
    <div class="spinner"></div>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: '40px'
  }
})
</script>

<style scoped>
.loading-spinner {
  display: inline-block;
  position: relative;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #74b9ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>