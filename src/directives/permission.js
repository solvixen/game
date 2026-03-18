/**
 * 权限自定义指令
 * 用法：v-permission="['admin', 'operator']"
 */

import { hasPermission } from '@/utils/permission'

export default {
  mounted(el, binding) {
    const { value } = binding
    
    // 如果没有传入权限值，直接显示
    if (!value) return
    
    // 判断是否有权限
    const hasPerm = hasPermission(value)
    
    // 如果没有权限，移除元素
    if (!hasPerm) {
      // 先尝试从父元素移除
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      } else {
        // 如果没有父元素，隐藏自身
        el.style.display = 'none'
      }
    }
  },
  
  updated(el, binding) {
    const { value, oldValue } = binding
    
    // 如果权限值没有变化，不处理
    if (value === oldValue) return
    
    // 重新判断权限
    const hasPerm = hasPermission(value)
    
    if (!hasPerm) {
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      } else {
        el.style.display = 'none'
      }
    } else {
      el.style.display = '' // 恢复显示
    }
  }
}