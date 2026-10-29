import axios, { AxiosError } from 'axios'
import type { ModelCreate, ModelUpdate, ModelResponse, ModelListResponse, ModelVersionCreate, ModelVersionResponse, ModelArchitectureSchema } from '../types/models'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api/v1'
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const message = (error.response.data as any)?.detail || error.message
      return Promise.reject(new Error(`${error.response.status}: ${message}`))
    }
    return Promise.reject(error)
  }
)

export interface PaginationParams {
  page?: number
  page_size?: number
  architecture?: ModelArchitectureSchema
  is_active?: boolean
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export const modelsApi = {
  list: (params: PaginationParams = {}) =>
    api.get<ModelListResponse>('/models', { params }),

  get: (id: string) =>
    api.get<ModelResponse>(`/models/${id}`),

  create: (data: ModelCreate) =>
    api.post<ModelResponse>('/models', data),

  update: (id: string, data: ModelUpdate) =>
    api.patch<ModelResponse>(`/models/${id}`, data),

  delete: (id: string) =>
    api.delete(`/models/${id}`),

  listVersions: (modelId: string) =>
    api.get<ModelVersionResponse[]>(`/models/${modelId}/versions`),

  createVersion: (modelId: string, data: ModelVersionCreate) =>
    api.post<ModelVersionResponse>(`/models/${modelId}/versions`, data),
}

export const healthApi = {
  check: () => api.get<{ status: string; version: string; environment: string }>('/health', { baseURL: API_BASE.replace(/\/api\/v1\/?$/, '') }),
}

export default api