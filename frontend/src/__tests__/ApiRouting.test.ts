import axios from 'axios'
import { describe, it, expect } from 'vitest'
import api, { modelsApi } from '../api/client'

describe('model registry transport routing', () => {
  it('sends browser model operations to the mounted backend v1 routes', async () => {
    const requests: string[] = []
    const previous = api.defaults.adapter
    api.defaults.adapter = async config => {
      requests.push(axios.getUri(config))
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }
    try {
      await modelsApi.list()
      await modelsApi.create({ name: 'routing-model', display_name: 'Routing Model', architecture: 'sdxl', format: 'safetensors' })
      await modelsApi.get('model-id')
      expect(requests).toEqual(['/api/v1/models', '/api/v1/models', '/api/v1/models/model-id'])
    } finally { api.defaults.adapter = previous }
  })
})
