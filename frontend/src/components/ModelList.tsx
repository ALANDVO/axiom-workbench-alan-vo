import { ModelResponse } from '../types/models'
import { ARCHITECTURE_LABELS, FORMAT_LABELS } from '../types/models'

interface ModelListProps {
  models: ModelResponse[]
  isLoading: boolean
  onEdit: (model: ModelResponse) => void
  onDelete: (model: ModelResponse) => void
  onViewVersions: (model: ModelResponse) => void
}

export function ModelList({ models, isLoading, onEdit, onDelete, onViewVersions }: ModelListProps) {
  if (isLoading) {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Architecture</th>
              <th>Format</th>
              <th>Status</th>
              <th>Size</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td><div className="spinner" style={{ width: '80px', height: '16px', borderRadius: '4px' }} /></td>
                <td><div className="spinner" style={{ width: '60px', height: '16px', borderRadius: '4px' }} /></td>
                <td><div className="spinner" style={{ width: '70px', height: '16px', borderRadius: '4px' }} /></td>
                <td><div className="spinner" style={{ width: '50px', height: '16px', borderRadius: '4px' }} /></td>
                <td><div className="spinner" style={{ width: '70px', height: '16px', borderRadius: '4px' }} /></td>
                <td><div className="spinner" style={{ width: '90px', height: '16px', borderRadius: '4px' }} /></td>
                <td><div className="spinner" style={{ width: '80px', height: '16px', borderRadius: '4px' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <h3>No models registered</h3>
        <p>Click "Add Model" to register your first diffusion model.</p>
      </div>
    )
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024
      unit++
    }
    return `${size.toFixed(1)} ${units[unit]}`
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Architecture</th>
            <th>Format</th>
            <th>Status</th>
            <th>Size</th>
            <th>Created</th>
            <th style={{ width: '180px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {models.map(model => (
            <tr key={model.id}>
              <td>
                <div style={{ fontWeight: 500 }}>{model.name}</div>
                {model.display_name !== model.name && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{model.display_name}</div>
                )}
              </td>
              <td>
                <span className="badge badge-neutral">{ARCHITECTURE_LABELS[model.architecture]}</span>
              </td>
              <td>
                <span className="badge badge-neutral">{FORMAT_LABELS[model.format]}</span>
              </td>
              <td>
                <span className={model.is_active ? 'badge badge-success' : 'badge badge-warning'}>
                  {model.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{formatSize(model.file_size)}</td>
              <td style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{formatDate(model.created_at)}</td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEdit(model)}
                    aria-label={`Edit ${model.name}`}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onViewVersions(model)}
                    aria-label={`View versions for ${model.name}`}
                  >
                    Versions
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onDelete(model)}
                    aria-label={`Delete ${model.name}`}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}