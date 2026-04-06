import axios from 'axios'

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_APP_API_BASE,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
})

httpClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

httpClient.interceptors.response.use(
    response => response.data,
    error => {
        if (error.response?.status === 401) {
            localStorage.clear()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default httpClient