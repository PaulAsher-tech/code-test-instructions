import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shortenUrl, listUrls, deleteAlias } from '../client'
import { ApiError } from '../../types'

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('shortenUrl', () => {
    it('should successfully shorten a URL', async () => {
      const mockResponse = { shortUrl: 'http://localhost:8080/test-alias' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse)
      })

      const result = await shortenUrl({ fullUrl: 'https://example.com' })

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/shorten'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ fullUrl: 'https://example.com' })
        })
      )
    })

    it('should include custom alias when provided', async () => {
      const mockResponse = { shortUrl: 'http://localhost:8080/my-alias' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse)
      })

      await shortenUrl({ fullUrl: 'https://example.com', customAlias: 'my-alias' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ fullUrl: 'https://example.com', customAlias: 'my-alias' })
        })
      )
    })

    it('should throw ApiError on 400 status', async () => {
      const errorMessage = 'Alias already exists'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: errorMessage }),
        text: async () => JSON.stringify({ message: errorMessage })
      })

      await expect(shortenUrl({ fullUrl: 'https://example.com', customAlias: 'existing' })).rejects.toThrow(
        ApiError
      )
      await expect(shortenUrl({ fullUrl: 'https://example.com', customAlias: 'existing' })).rejects.toThrow(
        errorMessage
      )
    })

    it('should throw ApiError on 404 status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
        text: async () => JSON.stringify({ message: 'Not found' })
      })

      await expect(shortenUrl({ fullUrl: 'https://example.com' })).rejects.toThrow(ApiError)
    })

    it('should handle response without message field', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
        text: async () => '{}'
      })

      await expect(shortenUrl({ fullUrl: 'https://example.com' })).rejects.toThrow(ApiError)
    })
  })

  describe('listUrls', () => {
    it('should successfully fetch list of URLs', async () => {
      const mockUrls = [
        { alias: 'test1', fullUrl: 'https://example.com/1', shortUrl: 'http://localhost:8080/test1' },
        { alias: 'test2', fullUrl: 'https://example.com/2', shortUrl: 'http://localhost:8080/test2' }
      ]
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUrls,
        text: async () => JSON.stringify(mockUrls)
      })

      const result = await listUrls()

      expect(result).toEqual(mockUrls)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/urls'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should return empty array when no URLs exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
        text: async () => '[]'
      })

      const result = await listUrls()

      expect(result).toEqual([])
    })

    it('should throw ApiError on error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
        text: async () => JSON.stringify({ message: 'Server error' })
      })

      await expect(listUrls()).rejects.toThrow(ApiError)
    })
  })

  describe('deleteAlias', () => {
    it('should successfully delete an alias', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => ''
      })

      await deleteAlias('test-alias')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-alias'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should URL encode alias', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => ''
      })

      await deleteAlias('alias with spaces')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('alias%20with%20spaces'),
        expect.any(Object)
      )
    })

    it('should throw ApiError on 404 status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Alias not found' }),
        text: async () => JSON.stringify({ message: 'Alias not found' })
      })

      await expect(deleteAlias('non-existent')).rejects.toThrow(ApiError)
    })

    it('should handle 204 response correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => ''
      })

      await expect(deleteAlias('test')).resolves.toBeUndefined()
    })
  })
})

