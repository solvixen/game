import { ref, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from './useWebSocket'

export function useRealtimeData(initialData = {}) {
  const data = ref(initialData)
  const history = ref([])
  const maxHistory = 100

  const { lastMessage } = useWebSocket('gameData', (newData) => {
    // 更新当前数据
    data.value = { ...data.value, ...newData }
    
    // 保存历史记录
    history.value.push({
      timestamp: Date.now(),
      ...newData
    })
    
    // 限制历史记录长度
    if (history.value.length > maxHistory) {
      history.value.shift()
    }
  })

  const getHistory = (key) => {
    return history.value.map(item => ({
      time: item.timestamp,
      value: item[key]
    }))
  }

  return {
    data,
    history,
    getHistory
  }
}