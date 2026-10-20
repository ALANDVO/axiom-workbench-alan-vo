export type ModelArchitectureSchema =
  | 'sdxl'
  | 'flux'
  | 'sd15'
  | 'sd3'
  | 'hunyuan'
  | 'ltx'
  | 'wan'
  | 'other'

export type ModelFormatSchema =
  | 'safetensors'
  | 'ckpt'
  | 'pt'
  | 'bin'
  | 'gguf'

export interface ModelBase {
  name: string
  display_name: string
  description?: string
  architecture: ModelArchitectureSchema
  format: ModelFormatSchema
}

export interface ModelCreate extends ModelBase {
  file_path?: string
  file_size?: number
  hash_sha256?: string
  config_json?: string
}

export interface ModelUpdate {
  display_name?: string
  description?: string
  architecture?: ModelArchitectureSchema
  format?: ModelFormatSchema
  file_path?: string
  file_size?: number
  hash_sha256?: string
  config_json?: string
  is_active?: boolean
}

export interface ModelResponse extends ModelBase {
  id: string
  file_path?: string
  file_size?: number
  hash_sha256?: string
  config_json?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ModelListResponse {
  items: ModelResponse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ModelVersionBase {
  version: string
  file_path: string
  file_size: number
  hash_sha256: string
  changelog?: string
  is_default?: boolean
}

export interface ModelVersionCreate extends ModelVersionBase {}

export interface ModelVersionResponse extends ModelVersionBase {
  id: string
  model_id: string
  created_at: string
}

export interface HealthResponse {
  status: string
  version: string
  environment: string
}

export const ARCHITECTURE_LABELS: Record<ModelArchitectureSchema, string> = {
  sdxl: 'SDXL',
  flux: 'FLUX',
  sd15: 'SD 1.5',
  sd3: 'SD 3',
  hunyuan: 'Hunyuan',
  ltx: 'LTX',
  wan: 'Wan',
  other: 'Other',
}

export const FORMAT_LABELS: Record<ModelFormatSchema, string> = {
  safetensors: 'SafeTensors',
  ckpt: 'Checkpoint',
  pt: 'PyTorch',
  bin: 'Binary',
  gguf: 'GGUF',
}