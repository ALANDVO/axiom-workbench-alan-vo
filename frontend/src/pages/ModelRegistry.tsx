import { useState, useEffect, useCallback } from 'react'
import { ModelResponse, ModelCreate, ModelUpdate, ModelVersionResponse, ModelArchitectureSchema } from '../types/models'
import { modelsApi, PaginationParams } from '../api/client'
import { ModelForm } from '../components/ModelForm'
import { ModelList } from '../components/ModelList'

export function ModelRegistry() {
  const [models, setModels] = useState<ModelResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [filters, setFilters] = useState({
    architecture: '',
    isActive: '',
    search: '',
    sortBy: '',
    sortOrder: 'desc' as 'asc' | 'desc',
  })

  // Modal states
  const [showForm, setShowForm] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Versions modal
  const [showVersions, setShowVersions] = useState(false)
  const [versionsModel, setVersionsModel] = useState<ModelResponse | null>(null)
  const [versions, setVersions] = useState<ModelVersionResponse[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)

  const fetchModels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: PaginationParams = {
        page: pagination.page,
        page_size: pagination.pageSize,
        architecture: (filters.architecture || undefined) as ModelArchitectureSchema | undefined,
        is_active: filters.isActive === '' ? undefined : filters.isActive === 'true',
        search: filters.search || undefined,
        sort_by: filters.sortBy || undefined,
        sort_order: filters.sortOrder,
      }
      const response = await modelsApi.list(params)
      setModels(response.data.items)
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.total_pages,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.pageSize, filters])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const handleAdd = () => {
    setEditingModel(null)
    setShowForm(true)
  }

  const handleEdit = (model: ModelResponse) => {
    setEditingModel(model)
    setShowForm(true)
  }

  const handleDelete = async (model: ModelResponse) => {
    if (!window.confirm(`Delete model "${model.name}"? This cannot be undone.`)) return
    try {
      await modelsApi.delete(model.id)
      fetchModels()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete model')
    }
  }

  const handleViewVersions = async (model: ModelResponse) => {
    setVersionsModel(model)
    setShowVersions(true)
    setVersionsLoading(true)
    try {
      const response = await modelsApi.listVersions(model.id)
      setVersions(response.data)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setVersionsLoading(false)
    }
  }

  const handleFormSubmit = async (data: ModelCreate | ModelUpdate) => {
    setIsSubmitting(true)
    try {
      if (editingModel) {
        await modelsApi.update(editingModel.id, data as ModelUpdate)
      } else {
        await modelsApi.create(data as ModelCreate)
      }
      setShowForm(false)
      setEditingModel(null)
      fetchModels()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save model')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingModel(null)
  }

  const handleCloseVersions = () => {
    setShowVersions(false)
    setVersionsModel(null)
    setVersions([])
  }

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Model Registry</h1>
          <p className="page-subtitle">Manage your diffusion model library</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Model
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px', color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label htmlFor="filter-search">Search</label>
            <input
              id="filter-search"
              type="text"
              placeholder="Search models..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              onKeyDown={e => e.key === 'Enter' && fetchModels()}
            />
          </div>
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label htmlFor="filter-arch">Architecture</label>
            <select
              id="filter-arch"
              value={filters.architecture}
              onChange={e => setFilters(prev => ({ ...prev, architecture: e.target.value, page: 1 }))}
            >
              <option value="">All</option>
              <option value="sdxl">SDXL</option>
              <option value="flux">FLUX</option>
              <option value="sd15">SD 1.5</option>
              <option value="sd3">SD 3</option>
              <option value="hunyuan">Hunyuan</option>
              <option value="ltx">LTX</option>
              <option value="wan">Wan</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '140px' }}>
            <label htmlFor="filter-active">Status</label>
            <select
              id="filter-active"
              value={filters.isActive}
              onChange={e => setFilters(prev => ({ ...prev, isActive: e.target.value, page: 1 }))}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '160px' }}>
            <label htmlFor="filter-sort">Sort By</label>
            <select
              id="filter-sort"
              value={filters.sortBy}
              onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
            >
              <option value="">Default (Newest)</option>
              <option value="name">Name</option>
              <option value="display_name">Display Name</option>
              <option value="architecture">Architecture</option>
              <option value="format">Format</option>
              <option value="created_at">Created At</option>
              <option value="updated_at">Updated At</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '120px' }}>
            <label htmlFor="filter-sort-order">Order</label>
            <select
              id="filter-sort-order"
              value={filters.sortOrder}
              onChange={e => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc', page: 1 }))}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <ModelList
        models={models}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewVersions={handleViewVersions}
      />

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1 || isLoading}
            aria-label="Previous page"
          >
            ‹ Prev
          </button>
          <span style={{ color: 'var(--color-text-secondary)', minWidth: '80px', textAlign: 'center' }}>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            aria-label="Next page"
          >
            Next ›
          </button>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingModel ? 'Edit Model' : 'Register Model'}</h2>
              <button className="modal-close" onClick={handleCloseForm} aria-label="Close">✕</button>
            </div>
            <ModelForm
              initialData={editingModel}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseForm}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {showVersions && versionsModel && (
        <div className="modal-overlay" onClick={handleCloseVersions}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Versions: {versionsModel.display_name}</h2>
              <button className="modal-close" onClick={handleCloseVersions} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              {versionsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  <p>Loading versions...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No versions</h3>
                  <p>This model has no version history yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>File Size</th>
                        <th>SHA256</th>
                        <th>Default</th>
                        <th>Created</th>
                        <th>Changelog</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.map(v => (
                        <tr key={v.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{v.version}</td>
                          <td>{(v.file_size / 1024 / 1024).toFixed(1)} MB</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{v.hash_sha256.slice(0, 16)}…</td>
                          <td>{v.is_default ? <span className="badge badge-success">Yes</span> : '—'}</td>
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                            {new Date(v.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.changelog || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}