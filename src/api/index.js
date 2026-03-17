import httpClient from './httpClient'
import websocket from './websocket'
import * as gameDataService from './services/gameData'
import * as mockData from './services/mockData'

const useMock = import.meta.env.VITE_APP_MOCK_ENABLED === 'true'

export const api = {
  // 游戏数据
  getGameMetrics: () => 
    useMock ? mockData.getGameMetrics() : gameDataService.getGameMetrics(),
  
  getServerStatus: () => 
    useMock ? mockData.getServerStatus() : gameDataService.getServerStatus(),
  
  getPlayerStats: () => 
    useMock ? mockData.getPlayerStats() : gameDataService.getPlayerStats(),
  
  // WebSocket
  websocket
}