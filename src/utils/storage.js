/**
 * 本地存储封装
 */
const PREFIX = 'game_monitor_'

export const storage = {
  // 设置
  set(key, value) {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(PREFIX + key, serialized)
      return true
    } catch (error) {
      console.error('存储失败:', error)
      return false
    }
  },
  
  // 获取
  get(key, defaultValue = null) {
    try {
      const serialized = localStorage.getItem(PREFIX + key)
      if (serialized === null) return defaultValue
      return JSON.parse(serialized)
    } catch (error) {
      console.error('读取失败:', error)
      return defaultValue
    }
  },
  
  // 删除
  remove(key) {
    localStorage.removeItem(PREFIX + key)
  },
  
  // 清空
  clear() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  },
  
  // 获取所有
  getAll() {
    const items = {}
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        const originalKey = key.replace(PREFIX, '')
        items[originalKey] = this.get(originalKey)
      }
    })
    return items
  }
}

/**
 * 会话存储封装
 */
export const session = {
  set(key, value) {
    try {
      const serialized = JSON.stringify(value)
      sessionStorage.setItem(PREFIX + key, serialized)
      return true
    } catch (error) {
      console.error('存储失败:', error)
      return false
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const serialized = sessionStorage.getItem(PREFIX + key)
      if (serialized === null) return defaultValue
      return JSON.parse(serialized)
    } catch (error) {
      console.error('读取失败:', error)
      return defaultValue
    }
  },
  
  remove(key) {
    sessionStorage.removeItem(PREFIX + key)
  },
  
  clear() {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        sessionStorage.removeItem(key)
      }
    })
  }
}