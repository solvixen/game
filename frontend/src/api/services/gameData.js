import httpClient from '../httpClient'

export const getGameMetrics = () => {
  return httpClient.get('/metrics')
}

export const getServerStatus = () => {
  return httpClient.get('/servers/status')
}

export const getPlayerStats = () => {
  return httpClient.get('/players/stats')
}