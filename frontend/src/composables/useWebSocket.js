import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/api'

export function useWebSocket(eventType, callback) {
  const isConnected = ref(false)
  const lastMessage = ref(null)

  const handleMessage = (data) => {
    lastMessage.value = data
    if (callback) callback(data)
  }

  onMounted(() => {
    api.websocket.on(eventType, handleMessage)
    isConnected.value = true
  })

  onUnmounted(() => {
    api.websocket.off(eventType, handleMessage)
  })

  return {
    isConnected,
    lastMessage
  }
}