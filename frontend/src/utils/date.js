import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

/**
 * 获取日期范围
 */
export const getDateRange = (type) => {
  const now = dayjs()
  
  switch (type) {
    case 'today':
      return {
        start: now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        end: now.endOf('day').format('YYYY-MM-DD HH:mm:ss')
      }
    case 'yesterday':
      return {
        start: now.subtract(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        end: now.subtract(1, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss')
      }
    case 'week':
      return {
        start: now.startOf('week').format('YYYY-MM-DD HH:mm:ss'),
        end: now.endOf('week').format('YYYY-MM-DD HH:mm:ss')
      }
    case 'month':
      return {
        start: now.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
        end: now.endOf('month').format('YYYY-MM-DD HH:mm:ss')
      }
    default:
      return {
        start: now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        end: now.endOf('day').format('YYYY-MM-DD HH:mm:ss')
      }
  }
}

/**
 * 格式化日期范围
 */
export const formatDateRange = (start, end, format = 'YYYY-MM-DD') => {
  if (!start || !end) return ''
  const startStr = dayjs(start).format(format)
  const endStr = dayjs(end).format(format)
  return `${startStr} 至 ${endStr}`
}

/**
 * 获取相对时间描述
 */
export const getRelativeTimeDesc = (timestamp) => {
  const now = dayjs()
  const target = dayjs(timestamp)
  const diffMinutes = now.diff(target, 'minute')
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`
  return target.format('MM-DD HH:mm')
}

/**
 * 时间戳转时间轴标签
 */
export const getTimeAxisLabels = (start, end, count = 24) => {
  const startTime = dayjs(start)
  const endTime = dayjs(end)
  const diff = endTime.diff(startTime, 'hour')
  const interval = Math.max(1, Math.floor(diff / (count - 1)))
  
  const labels = []
  for (let i = 0; i < count; i++) {
    const time = startTime.add(i * interval, 'hour')
    labels.push(time.format('HH:mm'))
  }
  
  return labels
}