/**
 * 验证是否为有效的IP地址
 */
export const isValidIP = (ip) => {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!pattern.test(ip)) return false
  
  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

/**
 * 验证是否为有效的端口号
 */
export const isValidPort = (port) => {
  const num = parseInt(port, 10)
  return num >= 1 && num <= 65535
}

/**
 * 验证是否为有效的URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证是否为有效的邮箱
 */
export const isValidEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

/**
 * 验证是否为有效的手机号（中国大陆）
 */
export const isValidPhone = (phone) => {
  const pattern = /^1[3-9]\d{9}$/
  return pattern.test(phone)
}

/**
 * 验证密码强度
 * 至少8位，包含大小写字母和数字
 */
export const checkPasswordStrength = (password) => {
  if (!password || password.length < 8) return 0
  
  let score = 0
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  return score
}