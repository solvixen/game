// 生成随机数据
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export const getGameMetrics = () => {
  return Promise.resolve({
    onlinePlayers: random(1000, 5000),
    totalRevenue: random(5000, 20000),
    activeServers: random(5, 8),
    avgResponseTime: random(30, 150)
  })
}

export const getServerStatus = () => {
  const servers = []
  const regions = ['华北', '华东', '华南', '西南', '海外']
  
  for (let i = 0; i < 5; i++) {
    servers.push({
      id: `server-${i+1}`,
      name: `游戏服务器-${i+1}`,
      region: regions[i],
      status: Math.random() > 0.2 ? 'online' : 'offline',
      players: random(200, 1500),
      cpu: random(20, 90),
      memory: random(30, 85),
      latency: random(20, 200)
    })
  }
  
  return Promise.resolve(servers)
}

export const getPlayerStats = () => {
  return Promise.resolve({
    total: 25890,
    active: 12345,
    new: 345,
    retention: {
      day1: 45,
      day7: 23,
      day30: 12
    }
  })
}