import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/api'

export function useWebSocket(eventType, callback) {
  const isConnected = ref(api.websocket.connected)
  const lastMessage = ref(null)

  const handleMessage = (payload, servers) => {
    lastMessage.value = payload
    if (callback) callback(payload, servers)
  }

  let removeStatusListener = null

  onMounted(() => {
    api.websocket.connect()
    api.websocket.on(eventType, handleMessage)
    // 监听真实连接状态
    removeStatusListener = api.websocket.onStatus((connected) => {
      isConnected.value = connected
    })
  })

  onUnmounted(() => {
    api.websocket.off(eventType, handleMessage)
    if (removeStatusListener) removeStatusListener()
  })

  return {
    isConnected,
    lastMessage
  }
}
