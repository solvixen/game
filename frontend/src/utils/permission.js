/**
 * 权限工具函数
 * 用于判断用户角色权限
 */

/**
 * 检查当前用户是否有指定角色的权限
 * @param {Array|string} allowedRoles - 允许的角色数组或单个角色
 * @returns {boolean} 是否有权限
 */
export const hasPermission = (allowedRoles) => {
  const userRole = localStorage.getItem('userRole') || 'viewer'
  
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole)
  }
  
  return allowedRoles === userRole
}

/**
 * 检查是否为管理员
 * @returns {boolean}
 */
export const isAdmin = () => {
  return localStorage.getItem('userRole') === 'admin'
}

/**
 * 检查是否为运营人员
 * @returns {boolean}
 */
export const isOperator = () => {
  return localStorage.getItem('userRole') === 'operator'
}

/**
 * 检查是否为开发人员
 * @returns {boolean}
 */
export const isDeveloper = () => {
  return localStorage.getItem('userRole') === 'developer'
}

/**
 * 检查是否为观察员
 * @returns {boolean}
 */
export const isViewer = () => {
  return localStorage.getItem('userRole') === 'viewer'
}

/**
 * 获取当前用户角色
 * @returns {string} 角色名称
 */
export const getCurrentRole = () => {
  return localStorage.getItem('userRole') || 'viewer'
}

/**
 * 获取角色中文名称
 * @param {string} role - 角色英文名
 * @returns {string} 角色中文名
 */
export const getRoleName = (role) => {
  const roleMap = {
    admin: '管理员',
    operator: '运营人员',
    developer: '开发人员',
    viewer: '观察员'
  }
  return roleMap[role] || role
}