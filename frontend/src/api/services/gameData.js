import httpClient from '../httpClient'

export const getGameMetrics = () => {
  return httpClient.get('/metrics')
}

export const getServerStatus = () => {
  return httpClient.get('/servers')
}

export const getPlayerStats = () => {
  return httpClient.get('/players/stats')
}

// ==================== 用户管理 ====================
export const getUserList = () => {
  return httpClient.get('/users')
}

export const createUser = (data) => {
  return httpClient.post('/users', data)
}

export const updateUser = (id, data) => {
  return httpClient.put(`/users/${id}`, data)
}

export const deleteUser = (id) => {
  return httpClient.delete(`/users/${id}`)
}
