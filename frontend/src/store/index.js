import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export const useGameDataStore = defineStore('gameData', () => {
  // state
  const onlinePlayers = ref(0)
  const revenue = ref(0)
  const servers = ref([])
  const alerts = ref([])
  const loading = ref(false)
  const historyData = ref([])

  // getters
  const totalPlayers = computed(() => onlinePlayers.value)
  const activeServers = computed(() => 
    servers.value.filter(s => s.status === 'online').length
  )
  const criticalAlerts = computed(() => 
    alerts.value.filter(a => a.level === 'critical')
  )

  // actions
  const initWebSocket = () => {
    api.websocket.connect()
    
    api.websocket.on('gameData', (data) => {
      onlinePlayers.value = data.onlinePlayers || onlinePlayers.value
      revenue.value = data.revenue || revenue.value
      
      // 保存历史数据
      historyData.value.push({
        time: Date.now(),
        players: onlinePlayers.value,
        revenue: revenue.value
      })
      
      if (historyData.value.length > 100) {
        historyData.value.shift()
      }
    })
    
    api.websocket.on('alert', (alert) => {
      alerts.value.unshift({
        id: Date.now(),
        ...alert,
        time: Date.now()
      })
      
      if (alerts.value.length > 50) {
        alerts.value.pop()
      }
    })
  }

  const fetchServerStatus = async () => {
    loading.value = true
    try {
      servers.value = await api.getServerStatus()
    } catch (error) {
      console.error('获取服务器状态失败:', error)
    } finally {
      loading.value = false
    }
  }

  const clearAlerts = () => {
    alerts.value = []
  }

  return {
    // state
    onlinePlayers,
    revenue,
    servers,
    alerts,
    loading,
    historyData,
    // getters
    totalPlayers,
    activeServers,
    criticalAlerts,
    // actions
    initWebSocket,
    fetchServerStatus,
    clearAlerts
  }
})