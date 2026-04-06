<template>
  <div class="base-card" :class="{ 'hoverable': hoverable }">
    <div v-if="title" class="card-header">
      <h3>{{ title }}</h3>
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  hoverable: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.base-card {
  background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
  border-radius: 10px;
  padding: 20px;
  color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.hoverable:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #8a9bb2;
  margin: 0;
}

.card-footer {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>