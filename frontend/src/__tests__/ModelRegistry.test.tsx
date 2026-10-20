import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModelRegistry } from '../pages/ModelRegistry'
import { modelsApi } from '../api/client'

// Mock the API client
vi.mock('../api/client', () => ({
  modelsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listVersions: vi.fn(),
    createVersion: vi.fn(),
  },
  healthApi: {
    check: vi.fn(),
  },
}))

const mockModels = [
  {
    id: '1',
    name: 'flux-dev',
    display_name: 'FLUX.1 Dev',
    description: 'FLUX.1 Dev model',
    format: 'safetensors' as const,
    file_path: '/models/flux-dev.safetensors',
    file_size: 23000000000,
    hash_sha256: 'a'.repeat(64),
    config_json: undefined,
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'sdxl-base',
    display_name: 'SDXL Base',
    description: 'SDXL Base model',
    architecture: 'sdxl' as const,
    format: 'safetensors' as const,
    file_path: '/models/sdxl-base.safetensors',
    file_size: 6500000000,
    hash_sha256: 'b'.repeat(64),
    config_json: undefined,
    is_active: true,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
]

describe('ModelRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(modelsApi.list).mockResolvedValue({
      data: {
        items: mockModels,
        total: 2,
        page: 1,
        page_size: 20,
        total_pages: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {} as Record<string, string>,
      config: { headers: {} as Record<string, string> },
    } as any)
  })

  it('renders model list with data', async () => {
    render(<ModelRegistry />)

    await waitFor(() => {
      expect(screen.getByText('Model Registry')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('FLUX.1 Dev')).toBeInTheDocument()
      expect(screen.getByText('SDXL Base')).toBeInTheDocument()
    })
  })

  it('shows empty state when no models', async () => {
    vi.mocked(modelsApi.list).mockResolvedValue({
      data: { items: [], total: 0, page: 1, page_size: 20, total_pages: 1 },
      status: 200,
      statusText: 'OK',
      headers: {} as Record<string, string>,
      config: { headers: {} as Record<string, string> },
    } as any)

    render(<ModelRegistry />)

    await waitFor(() => {
      expect(screen.getByText('No models registered')).toBeInTheDocument()
    })
  })

  it('opens add model form when clicking Add Model', async () => {
    render(<ModelRegistry />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add model/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /add model/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Register Model' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e\.g\., flux-dev/i)).toBeInTheDocument()
    })
  })

  it('validates required fields on submit', async () => {
    render(<ModelRegistry />)

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /add model/i }))
    })

    fireEvent.click(screen.getByRole('button', { name: /register model/i }))

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Display name is required')).toBeInTheDocument()
    })
  })

  it('filters by architecture', async () => {
    render(<ModelRegistry />)

    await waitFor(() => {
      const select = screen.getByLabelText(/architecture/i)
      fireEvent.change(select, { target: { value: 'flux' } })
    })

    expect(modelsApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ architecture: 'flux' })
    )
  })

  it('searches models', async () => {
    render(<ModelRegistry />)

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/search models/i)
      fireEvent.change(input, { target: { value: 'flux' } })
    })

    expect(modelsApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'flux' })
    )
  })
})