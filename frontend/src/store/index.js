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
  const activeServers = computed(() => 
    servers.value.filter(s => s.status === 'online').length
  )
  const criticalAlerts = computed(() => 
    alerts.value.filter(a => a.level === 'critical')
  )

  // actions
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
    activeServers,
    criticalAlerts,
    // actions
    fetchServerStatus,
    clearAlerts
  }
})
