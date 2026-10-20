import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ModelForm } from '../components/ModelForm'
import type { ModelResponse } from '../types/models'
afterEach(cleanup)
describe('registry form payloads', () => {
 it('omits an optional blank hash when registering a model', async () => {
  const submit = vi.fn().mockResolvedValue(undefined)
  render(<ModelForm onSubmit={submit} onCancel={() => {}} isSubmitting={false} />)
  fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'new-model' } })
  fireEvent.change(screen.getByLabelText('Display Name *'), { target: { value: 'New Model' } })
  fireEvent.click(screen.getByRole('button', { name: 'Register Model' }))
  await waitFor(() => expect(submit).toHaveBeenCalledOnce())
  expect(submit.mock.calls[0][0].hash_sha256).toBeUndefined()
 })
 it('preserves edits to display name and architecture', async () => {
  const submit = vi.fn().mockResolvedValue(undefined)
  const model: ModelResponse = {id:'id', name:'existing', display_name:'Old Name', architecture:'other', format:'safetensors', is_active:true, created_at:'2026-01-01T00:00:00Z', updated_at:'2026-01-01T00:00:00Z'}
  render(<ModelForm initialData={model} onSubmit={submit} onCancel={() => {}} isSubmitting={false} />)
  fireEvent.change(screen.getByLabelText('Display Name *'), { target: { value: 'Updated Name' } })
  fireEvent.change(screen.getByLabelText('Architecture *'), { target: { value: 'sdxl' } })
  fireEvent.click(screen.getByRole('button', { name: 'Update Model' }))
  await waitFor(() => expect(submit).toHaveBeenCalledOnce())
  expect(submit.mock.calls[0][0]).toMatchObject({display_name:'Updated Name', architecture:'sdxl'})
  expect(submit.mock.calls[0][0]).not.toHaveProperty('name')
 })
})
