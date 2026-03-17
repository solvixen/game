import dayjs from 'dayjs'

/**
 * 数字格式化 - 添加千位分隔符
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 货币格式化
 */
export const formatCurrency = (amount, currency = 'CNY') => {
  if (amount === null || amount === undefined) return '¥0'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * 百分比格式化
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%'
  return `${value.toFixed(decimals)}%`
}

/**
 * 时间格式化
 */
export const formatTime = (timestamp, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!timestamp) return ''
  return dayjs(timestamp).format(format)
}

/**
 * 相对时间格式化
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = dayjs()
  const target = dayjs(timestamp)
  const diffSeconds = now.diff(target, 'second')
  
  if (diffSeconds < 60) return `${diffSeconds}秒前`
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}分钟前`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}小时前`
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}天前`
  
  return target.format('YYYY-MM-DD')
}

/**
 * 数据单位转换 (K, M, B)
 */
export const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return '0'
  if (num < 1000) return num.toString()
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K'
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M'
  return (num / 1000000000).toFixed(1) + 'B'
}

/**
 * 文件大小格式化
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 持续时间格式化 (秒转 HH:MM:SS)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 趋势箭头
 */
export const getTrendSymbol = (change) => {
  if (change > 0) return '↑'
  if (change < 0) return '↓'
  return '→'
}

/**
 * 趋势颜色
 */
export const getTrendColor = (change) => {
  if (change > 0) return '#00b894'
  if (change < 0) return '#e17055'
  return '#8a9bb2'
}

/**
 * 告警级别文本
 */
export const getAlertLevelText = (level) => {
  const map = {
    critical: '紧急',
    warning: '警告',
    info: '信息'
  }
  return map[level] || level
}

/**
 * 告警级别颜色
 */
export const getAlertLevelColor = (level) => {
  const map = {
    critical: '#e17055',
    warning: '#fdcb6e',
    info: '#74b9ff'
  }
  return map[level] || '#8a9bb2'
}

/**
 * 服务器状态文本
 */
export const getServerStatusText = (status) => {
  return status === 'online' ? '在线' : '离线'
}

/**
 * 服务器状态颜色
 */
export const getServerStatusColor = (status) => {
  return status === 'online' ? '#00b894' : '#e17055'
}