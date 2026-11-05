import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { ModelCreate, ModelUpdate, ModelResponse, ModelArchitectureSchema, ModelFormatSchema } from '../types/models'
import { ARCHITECTURE_LABELS, FORMAT_LABELS } from '../types/models'

// Form state type - always includes required fields for creation
interface FormData extends ModelCreate {
  // Override optional fields that may be undefined in ModelUpdate
  name: string
  display_name: string
  description: string
  file_path: string
  hash_sha256: string
  config_json: string
}

interface ModelFormProps {
  initialData?: ModelResponse | null
  onSubmit: (data: ModelCreate | ModelUpdate) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function ModelForm({ initialData, onSubmit, onCancel, isSubmitting }: ModelFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    display_name: '',
    description: '',
    architecture: 'other' as ModelArchitectureSchema,
    format: 'safetensors' as ModelFormatSchema,
    file_path: '',
    file_size: undefined,
    hash_sha256: '',
    config_json: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        display_name: initialData.display_name,
        description: initialData.description || '',
        architecture: initialData.architecture,
        format: initialData.format,
        file_path: initialData.file_path || '',
        file_size: initialData.file_size,
        hash_sha256: initialData.hash_sha256 || '',
        config_json: initialData.config_json || '',
      })
    }
  }, [initialData])

  const validateJson = (jsonString: string): string | null => {
    if (!jsonString.trim()) {
      return null
    }
    try {
      JSON.parse(jsonString)
      return null
    } catch {
      return 'Invalid JSON format'
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) newErrors.name = 'Name must be alphanumeric with underscores/hyphens'
    if (!formData.display_name.trim()) newErrors.display_name = 'Display name is required'
    if (formData.hash_sha256 && !/^[a-fA-F0-9]{64}$/.test(formData.hash_sha256)) newErrors.hash_sha256 = 'Must be 64 hex characters'
    const jsonError = validateJson(formData.config_json)
    if (jsonError) {
      newErrors.config_json = jsonError
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value, 10) : undefined) : value,
    }))
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const isEditing = !!initialData
    let submitData: ModelCreate | ModelUpdate
    const configJson = formData.config_json.trim()
    if (isEditing) {
      const { name: _name, ...updates } = formData
      submitData = { ...updates, hash_sha256: updates.hash_sha256 || undefined, config_json: configJson || undefined }
    } else {
      submitData = { ...formData, hash_sha256: formData.hash_sha256 || undefined, config_json: configJson || undefined }
    }
    await onSubmit(submitData)
  }

  const isEditing = !!initialData
  const submitLabel = isEditing ? 'Update Model' : 'Register Model'

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px' }}>
      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., flux-dev"
          disabled={isEditing || isSubmitting}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
        {!isEditing && <small className="help-text">Cannot be changed after creation</small>}
      </div>

      <div className="form-group">
        <label htmlFor="display_name">Display Name *</label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          value={formData.display_name}
          onChange={handleChange}
          placeholder="e.g., FLUX.1 Dev"
          disabled={isSubmitting}
        />
        {errors.display_name && <span className="error-message">{errors.display_name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Optional description"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="architecture">Architecture *</label>
          <select
            id="architecture"
            name="architecture"
            value={formData.architecture}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            {Object.entries(ARCHITECTURE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="format">Format *</label>
          <select
            id="format"
            name="format"
            value={formData.format}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            {Object.entries(FORMAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="file_path">File Path *</label>
        <input
          id="file_path"
          name="file_path"
          type="text"
          value={formData.file_path}
          onChange={handleChange}
          placeholder="/path/to/model.safetensors"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="file_size">File Size (bytes)</label>
          <input
            id="file_size"
            name="file_size"
            type="number"
            value={formData.file_size ?? ''}
            onChange={handleChange}
            min="0"
            placeholder="Optional"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="hash_sha256">SHA256 Hash *</label>
          <input
            id="hash_sha256"
            name="hash_sha256"
            type="text"
            value={formData.hash_sha256}
            onChange={handleChange}
            placeholder="64-character hex string"
            maxLength={64}
            disabled={isSubmitting}
          />
          {errors.hash_sha256 && <span className="error-message">{errors.hash_sha256}</span>}
          <small className="help-text">File integrity verification hash</small>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="config_json">Config JSON</label>
        <textarea
          id="config_json"
          name="config_json"
          value={formData.config_json}
          onChange={handleChange}
          rows={6}
          placeholder='{"key": "value"}'
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
          disabled={isSubmitting}
        />
        {errors.config_json && <span className="error-message">{errors.config_json}</span>}
        <small className="help-text">Optional model configuration as valid JSON</small>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="primary">
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
